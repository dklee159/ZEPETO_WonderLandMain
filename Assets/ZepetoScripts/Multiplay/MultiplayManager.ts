import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {GameObject, Object, Quaternion, Vector3, WaitForSeconds, WaitUntil, Resources} from 'UnityEngine';
import {ZepetoWorldMultiplay} from "ZEPETO.World";
import {Room, RoomData} from "ZEPETO.Multiplay";
import { EVENT_MESSAGE, GameObjectStatus, MESSAGE, PlayerDB, UpdateOwner } from '../SyncHelper/TypeSyncHelper';
import TransformSyncHelper from '../SyncHelper/TransformSyncHelper';
import DOTWeenSyncHelper from '../SyncHelper/DOTWeenSyncHelper';
import AnimatorSyncHelper from '../SyncHelper/AnimatorSyncHelper';
import EquipManager from '../../Scripts/Manager/EquipManager';
import SyncIndexManager from '../SyncIndexManager';
import GameManager from '../../Scripts/GameManager';
import LeaderBoardManager from '../../Scripts/Manager/LeaderBoardManager';
import QuestManager from '../../Scripts/Manager/QuestManager';
import HttpDataConnectionService from '../../Scripts/HttpDataConnectionService';
import DataManager from '../../Scripts/Manager/DataManager';
import TourManager from '../../Scripts/Game/Tour/TourManager';

export default class MultiplayManager extends ZepetoScriptBehaviour {
    public multiplay: ZepetoWorldMultiplay;
    public room: Room;

    @Header("Server connection status (View Only)")
    @SerializeField() private _pingCheckCount:number = 0;
    @SerializeField() private _latency:number = 0;
    @SerializeField() private _diffServerTime:number = 0;

    private _masterSessionId:string;
    private _tfHelpers: TransformSyncHelper[] = [];
    private _dtHelpers: DOTWeenSyncHelper[] = [];
    private _animHelper: AnimatorSyncHelper[] = [];
    
    private readonly pingInterval:number = 1;
    
    get pingCheckCount(){ return this._pingCheckCount; }
    get latency(){ return this._latency; }
    /* Singleton */
    private static m_instance: MultiplayManager = null;
    public static get instance(): MultiplayManager {
        if (this.m_instance === null) {
            this.m_instance = GameObject.FindObjectOfType<MultiplayManager>();
            if (this.m_instance === null) {
                this.m_instance = new GameObject(MultiplayManager.name).AddComponent<MultiplayManager>();
            }
        }
        return MultiplayManager.m_instance;
    }
    
    private Awake() {        
        MultiplayManager.m_instance = this;        
    }

    private Start() {
        if(!this.multiplay)
            this.multiplay = this.GetComponent<ZepetoWorldMultiplay>();
        if(!this.multiplay) console.warn("Add ZepetoWorldMultiplay First");
        this.multiplay.RoomJoined += (room: Room) => {
            this.room = room;
            this.StartCoroutine(this.SendPing());
            this.CheckMaster();
            this.GetInstantiate();
            this.HttpConnection();
            this.EquipConnection();
            this.TourConnection();
            this.TeleportConnection();
            this.LeaderBoardConnection();
        }
        this._dtHelpers = Object.FindObjectsOfType<DOTWeenSyncHelper>();
        this._animHelper = Object.FindObjectsOfType<AnimatorSyncHelper>();
    }

    /**Util**/
    private CheckMaster(){
        this.StartCoroutine(this.WaitPingCheck());

        this.room.AddMessageHandler(MESSAGE.MasterResponse, (masterSessionId :string) => {
            this._masterSessionId = masterSessionId;
            this._tfHelpers = Object.FindObjectsOfType<TransformSyncHelper>();
            this._tfHelpers.forEach((tf)=>{
                if(tf.UpdateOwnerType == UpdateOwner.Master){
                    tf.ChangeOwner(this._masterSessionId);
                }
            });
            this._dtHelpers.forEach((dt)=>{
                dt.ChangeOwner(this._masterSessionId);
            });
            this._animHelper.forEach((anim)=>{
                anim.ChangeOwner(this._masterSessionId);
            });
        });
    }

    /*** Http Data Connection Service ***/
    private HttpConnection() {
        this.room.AddMessageHandler(EVENT_MESSAGE.HTTP, (message:any) => {
            if(message.type == EVENT_MESSAGE.GET) {
                if(message.hasData) {
                    console.log(`YES DATA`);
                    this.SetPlayerData(message.body as PlayerDB);
                } else {
                    console.log(`NO DATA`);
                    this.SendRequest_POST();
                }            
            }
        });
    }

    private EquipConnection() {
        // this.room.AddMessageHandler(EVENT_MESSAGE.Equip, (equipData: EquipData) => {
        //     EquipManager.Instance.EquipItem(equipData);
        // });

        // this.room.AddMessageHandler(EVENT_MESSAGE.Unequip, (equipData:EquipData) => {                        
        //     EquipManager.Instance.UnEquipItem(equipData);
        // });
    }

    private TourConnection() {
        this.room.AddMessageHandler(EVENT_MESSAGE.TourState, (message: TourData) => {
            if (message.IsTour) {
                TourManager.Instance.TourStart(message.OwnerSessionId);                
            } else {
                TourManager.Instance.TourExit(message.OwnerSessionId);
            }
            SyncIndexManager.TourBalloonIsPlay = message.IsTour
        })
    }

    private TeleportConnection() {
        this.room.AddMessageHandler(EVENT_MESSAGE.Teleport, (message:any) => {
            GameManager.Instance.TeleportSignalReceived(message.OwnerSessionId, message.ZoneType)            
        });
    }

    private LeaderBoardConnection() {
        this.room.AddMessageHandler(EVENT_MESSAGE.LeaderBoard_Update, (message:any) => {
            LeaderBoardManager.Instance.Horror_UpdateRank();            
        });
    }

    // This function is used to instantiate a new object in the game. It sends a message to the server requesting the creation of the object, 
    // and waits for the server to respond with the necessary information to create it.
    private GetInstantiate(){
        this.room.Send(MESSAGE.RequestInstantiateCache);
        this.room.AddMessageHandler(MESSAGE.Instantiate, (message:InstantiateObj) => {
            const prefabObj = Resources.Load(message.prefabName) as GameObject;
            if(null === prefabObj){
                console.warn(`${message.prefabName} is null, Add Prefab in the Resources folder.`);
                return;
            }
            const spawnPosition = message.spawnPosition ? new Vector3(message.spawnPosition.x, message.spawnPosition.y, message.spawnPosition.z) : prefabObj.transform.position;
            const spawnRotation= message.spawnRotation ? new Quaternion(message.spawnRotation.x, message.spawnRotation.y, message.spawnRotation.z, message.spawnRotation.w) : prefabObj.transform.rotation

            const newObj:GameObject = Object.Instantiate(prefabObj, spawnPosition, spawnRotation) as GameObject;
            
            // If the object has a TransformSyncHelper script attached to it, it sets the script's ID and owner information. 
            // If the object does not have a TransformSyncHelper script, a warning is logged to the console.
            const tf = newObj?.GetComponent<TransformSyncHelper>();
            if(null === tf) { //Creates an none-sync object.
                console.warn(`${tf.name} does not have a TransformSyncHelper script.`);
                return;
            }

            tf.Id = message.Id;
            if(tf.UpdateOwnerType === UpdateOwner.Master) {
                tf.ChangeOwner(this._masterSessionId);
            }
            else if(message.ownerSessionId){
                tf.ChangeOwner(message.ownerSessionId);
            }
        });
    }

    /* Set Player Data */
    private SetPlayerData(playerData: PlayerDB) {
        const isLatest = playerData.version == EVENT_MESSAGE.Data_Version;
        console.log(`[HttpDataConnectionService] SetPlayerData-Receive : ${isLatest ? "Recent Data" : "old Data"}`);
        console.log(`[HttpDataConnectionService] PlayerData : \n${ JSON.stringify(playerData) }`);

        const updatePlayerDB: PlayerDB = HttpDataConnectionService.instance.UpdateData(playerData);
        console.log(`[HttpDataConnectionService] SetPlayerData-Send : ${updatePlayerDB.version == EVENT_MESSAGE.Data_Version ? "Recent Data" : "old Data"}`);
        console.log(`[HttpDataConnectionService] UpdatePlayerDB : \n${ JSON.stringify(updatePlayerDB) }`);
        this.SendRequest_POST(updatePlayerDB);        
    }

    /* POST */
    private SendRequest_POST(playerData?: PlayerDB) {
        const playerDB: PlayerDB = playerData ? playerData : HttpDataConnectionService.instance.InitData;        
        DataManager.Instance.PlayerDB = playerDB;
        DataManager.Instance.IsGetPlayerDB = true;
        // QuestManager.Instance.InitData(playerDB);

        const data = new RoomData();
        const jsonData = JSON.stringify(playerDB);
        data.Add(EVENT_MESSAGE.DATA, jsonData);
        data.Add(EVENT_MESSAGE.METHOD, EVENT_MESSAGE.POST);
        data.Add(EVENT_MESSAGE.URL, EVENT_MESSAGE.POST_URL);
        this.room.Send(EVENT_MESSAGE.HTTP, data.GetObject());
    }

    /** Destroy synchronization objects */
    public Destroy(DestroyObject: GameObject){
        const tf = DestroyObject.GetComponent<TransformSyncHelper>();
        const objId = tf?.Id;
        if(null === objId) {
            console.warn("Only objects that contain TransformSyncHelper scripts can be deleted.");
            return;
        }
        this.SendStatus(objId,GameObjectStatus.Destroyed);
        Object.Destroy(DestroyObject);
    }

    /** /Asset/Resources/ Add the prefabs to create in the path. Add TransformSyncHelper.ts to the prefab to synchronize objects as well as creation.
     @param prefabName The name or path of the prefab on the resource folder ( ex) Monsters/zombie)
     @param ownerSessionId Inject owner into objects whose transform sync type is Undefine
     */
    public Instantiate(prefabName: string, ownerSessionId? : string, spawnPosition?: Vector3, spawnRotation?: Quaternion){
        const newObjId = MultiplayManager.instance.GetServerTime().toString();

        const data = new RoomData();
        data.Add("Id", newObjId);
        data.Add("prefabName", prefabName);
        data.Add("ownerSessionId", ownerSessionId);
        if(undefined != spawnPosition) {
            const position = new RoomData();
            position.Add("x",spawnPosition.x);
            position.Add("y",spawnPosition.y);
            position.Add("z",spawnPosition.z);
            data.Add("spawnPosition", position.GetObject());
        }

        if(undefined != spawnRotation) {
            const rotation = new RoomData();
            rotation.Add("x",spawnRotation.x);
            rotation.Add("y",spawnRotation.y);
            rotation.Add("z",spawnRotation.z);
            rotation.Add("w",spawnRotation.w);
            data.Add("spawnRotation", rotation.GetObject());
        }

        this.room.Send(MESSAGE.Instantiate, data.GetObject());
    }
    
    // When the application is paused (e.g. when the screen is closed or the home screen is opened)
    private bPaused: boolean = false;
    private OnApplicationPause(pause: boolean) {
        if (pause && !this.bPaused) {
            this.PauseUser();
        }
        else if (!pause && this.bPaused) {
            this.UnPauseUser();
        }
    }

    private PauseUser(){
        this.room?.Send(MESSAGE.PauseUser);

        this.bPaused = true;
        this._pingCheckCount = 0;
        this._tfHelpers = Object.FindObjectsOfType<TransformSyncHelper>();
        // While paused, no information is received.
        this._tfHelpers?.forEach((tf)=> {
            if(tf.UpdateOwnerType === UpdateOwner.Master) {
                tf.ChangeOwner(null);
            }
            else if(tf.isOwner){
                this.SendStatus(tf.Id,GameObjectStatus.Pause);
            }
        });
        this._dtHelpers?.forEach((dt)=> {
            dt.ChangeOwner(null);
        });
    }

    private UnPauseUser(){
        this.room?.Send(MESSAGE.UnPauseUser);

        this.bPaused = false;
        this._tfHelpers = Object.FindObjectsOfType<TransformSyncHelper>();
        this._tfHelpers?.forEach((tf)=>{
            if(tf.isOwner){
                this.SendStatus(tf.Id,GameObjectStatus.Enable);
            }
            else{
                tf.ForceTarget();
            }
        });
    }

    // Ping every 1 second to check latency with the server *
    private *SendPing(){
        let RequestTime = Number(+new Date());
        let ResponseTime = Number(+new Date());
        let isResponseDone = false;

        this.room.AddMessageHandler(MESSAGE.CheckServerTimeResponse, (serverTime: number) => {
            ResponseTime = Number(+new Date());
            this._latency = (ResponseTime - RequestTime) * 0.5
            this._diffServerTime = Number(serverTime) - ResponseTime - this.latency;
            this._pingCheckCount++;
            isResponseDone = true;
        });

        while(true) {
            if(!this.bPaused) {
                this.room.Send(MESSAGE.CheckServerTimeRequest);
                RequestTime = Number(+new Date());
                yield new WaitUntil(() => isResponseDone == true);
            }
            isResponseDone = false;
            yield new WaitForSeconds(this.pingInterval);
        }
    }

    // After checking the connection with the server once, request the master information.
    private * WaitPingCheck(){
        if(this.pingCheckCount == 0)
            yield new WaitUntil(()=> this.pingCheckCount > 0)
        this.room.Send(MESSAGE.CheckMaster);
    }

    //Returns the current server time.
    public GetServerTime(){
        return this._diffServerTime + Number(+new Date());
    }

    private SendStatus(id:string, status: GameObjectStatus){
        const data = new RoomData();
        data.Add("Id", id);
        data.Add("Status", status);
        this.room.Send(MESSAGE.SyncTransformStatus, data.GetObject());
    }
}

interface InstantiateObj{
    Id: string;
    prefabName: string;
    ownerSessionId?: string;
    spawnPosition?: Vector3;
    spawnRotation?: Quaternion;
}

interface TourData {
    OwnerSessionId: string;
    IsTour: boolean;
}

interface EquipData {
    key: string;
    sessionId: string;
    itemName: string;
    prevItemName: string;
    bone: number;
    prevBone: number;
    wonderState: number;
}