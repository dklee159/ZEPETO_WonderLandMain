import {
    GameObject,
    Vector3,
    WaitForSeconds,
    Transform,
    Mathf,
    Random,
} from "UnityEngine";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import UIManager from "./Manager/UIManager";
import { RoomData } from "ZEPETO.Multiplay";
import {
    WorldService,
    ZepetoWorldContent,
    ZepetoWorldHelper,
} from "ZEPETO.World";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import DataManager from "./Manager/DataManager";
import CameraController from "./Controller/CameraController";
import TeleportController from "./Controller/TeleportController";
import LeaderBoardManager from "./Manager/LeaderBoardManager";
import HorrorZoneManager from "./Game/HorrorZone/HorrorZoneManager";
import DrawManager from "./Manager/DrawManager";
import {
    EVENT_MESSAGE,
    ScreenCanvasType,
    ZoneType,
    WorldId,
} from "../ZepetoScripts/SyncHelper/TypeSyncHelper";
import MultiplayManager from "../ZepetoScripts/Multiplay/MultiplayManager";
import InteractionController from "./Interaction/InteractionController";
import SDManager from "./Manager/SDManager";
import EquipManager from "./Manager/EquipManager";
import QuestManager from "./Manager/QuestManager";

export default class GameManager extends ZepetoScriptBehaviour {
    /* Singleton */
    private static _instance: GameManager;
    public static get Instance(): GameManager {
        if (!GameManager._instance) {
            const managerObj = GameObject.Find("GameManager");
            if (managerObj)
                GameManager._instance = managerObj.GetComponent<GameManager>();
        }
        return GameManager._instance;
    }

    /* Manager */

    /** Controller */
    // private attendController: AttendController;
    @SerializeField() private _cameraController: GameObject;
    private cameraController: CameraController;

    @SerializeField() private _teleportController: GameObject;
    private teleportController: TeleportController;

    @SerializeField() private _InteractionController: GameObject[] = [];

    @Header("Zone's Activate Target")
    // @SerializeField() private mainZoneObjects: GameObject[];
    @SerializeField()
    private horrorZoneObjects: GameObject[];

    public zepetoId: string;
    @SerializeField() hiddenObj: Transform;

    /* event */
    @SerializeField() private hideAndSeek: GameObject[] = [];

    Awake() {
        GameManager._instance = this;
        GameObject.DontDestroyOnLoad(this.gameObject);
    }

    Start() {
        ZepetoWorldHelper.GetUserIdInfo(
            [WorldService.userId],
            (users) => {
                this.zepetoId = users[0].zepetoId;
            },
            (err) => {}
        );

        /** Controllers */
        this.cameraController =
            this._cameraController.GetComponent<CameraController>();
        this.teleportController =
            this._teleportController.GetComponent<TeleportController>();

        this.StartCoroutine(this.LoadingScene());
    }

    private *LoadingScene() {
        const loadingUI = UIManager.Instance.GetScreenImage(
            ScreenCanvasType.Load
        );
        loadingUI.SetActive(true);

        // ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
        //     this.StartCoroutine(this.HideAndSeekEvent());
        // });

        /* Request Data */
        while (true) {
            yield null;
            if (
                MultiplayManager.instance.room !== null &&
                MultiplayManager.instance.room?.IsConnected
            ) {
                this.SendRequest_GET();
                break;
            }
        }

        /* Receive Data */
        while (true) {
            yield null;
            if (DataManager.Instance?.IsGetPlayerDB) break;
        }

        while (true) {
            yield new WaitForSeconds(2);
            if (
                MultiplayManager.instance.room !== null &&
                MultiplayManager.instance.room.IsConnected
            ) {
                if (
                    ZepetoPlayers.instance.HasPlayer(
                        MultiplayManager.instance.room.SessionId
                    )
                ) {
                    /* Remote Start */
                    this.CheckVisit();
                    this.cameraController.RemoteStart();
                    
                    console.log(
                        `[GameManager] CameraController loaded success`
                    );

                    QuestManager.Instance.InitData(
                        DataManager.Instance.PlayerDB
                    );

                    UIManager.Instance.RemoteStart();
                    console.log(`[GameManager] UIManager loaded success`);

                    DrawManager.Instance.RemoteStart();
                    console.log(`[GameManager] DrawManager loaded success`);

                    HorrorZoneManager.Instance.RemoteStart();
                    console.log(
                        `[GameManager] HorrorZoneManager loaded success`
                    );

                    LeaderBoardManager.Instance.RemoteStart(
                        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.userId
                    );
                    console.log(
                        `[GameManager] LeaderBoardManager loaded success`
                    );

                    for (const controller of this._InteractionController) {
                        controller
                            .GetComponent<InteractionController>()
                            .RemoteStart();
                    }
                    console.log(
                        `[GameManager] InteractionController loaded success`
                    );

                    
                    SDManager.Instance.Init(DataManager.Instance.PlayerDB);
                    EquipManager.Instance.InitEquipData();
                    loadingUI.SetActive(false);

                    this.StartCoroutine(this.HideAndSeekEvent());

                    // let allHas = false;
                    // for(const i of DataManager.Instance.PlayerDB.SDCharacter) {
                    //     allHas = i.Has;
                    //     if (!i.Has) break;
                    // }

                    // if(allHas) {
                    //     const zp = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
                    //     zp.transform.position = this.hiddenObj.position;
                    //     zp.transform.rotation = this.hiddenObj.rotation;

                    //     const zc = ZepetoPlayers.instance.ZepetoCamera;
                    //     zc.StateMachine.Stop();
                    //     zc.cameraParent.transform.position = this.hiddenObj.position;
                    //     zc.cameraParent.transform.rotation = this.hiddenObj.rotation;
                    //     zc.cameraParent.transform.Translate(new Vector3(0, 0, -1));
                    //     zc.StateMachine.Start(zc.currentState);
                    // }

                    this.StopCoroutine(this.LoadingScene());
                    break;
                }
            }
        }
    }

    public GetNextMonday() {
        const nextMonday = new Date();
    
        nextMonday.setDate(nextMonday.getDate() + 1);
        nextMonday.setDate(
            nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7)
        );
    
        nextMonday.setHours(0);
        nextMonday.setMinutes(0);
        nextMonday.setSeconds(0);
    
        return nextMonday.toDateString();
    }

    private CheckVisit() {
        if (DataManager.Instance.PlayerDB.nextMonday !== this.GetNextMonday()) {
            DataManager.Instance.PlayerDB.nextMonday = this.GetNextMonday();
            DataManager.Instance.PlayerDB.lastVisit = DataManager.Instance.PlayerDB.totalVisit;
            DataManager.Instance.PlayerDB.totalVisit = 0;
        }

        DataManager.Instance.PlayerDB.totalVisit += 1;
        // switch (WorldService.worldId) {
        //     case WorldId.WorldId_Land:
        //         DataManager.Instance.PlayerDB.entryTicket.wonderland = true;
        //         break;
        //     case WorldId.WorldId_Stage:
        //         DataManager.Instance.PlayerDB.entryTicket.stage = true;
        //         break;
        //     case WorldId.WorldId_Studio:
        //         DataManager.Instance.PlayerDB.entryTicket.studio = true;
        //         break;
        //     case WorldId.WorldId_Awards:
        //         DataManager.Instance.PlayerDB.entryTicket.awards = true;
        //         break;
        // }

        // if (
        //     DataManager.Instance.PlayerDB.entryTicket.wonderland == true &&
        //     DataManager.Instance.PlayerDB.entryTicket.stage == true &&
        //     DataManager.Instance.PlayerDB.entryTicket.studio == true &&
        //     DataManager.Instance.PlayerDB.entryTicket.awards == true
        // ) {
        //     DataManager.Instance.PlayerDB.entryTicket.wonderland = false;
        //     DataManager.Instance.PlayerDB.entryTicket.stage = false;
        //     DataManager.Instance.PlayerDB.entryTicket.studio = false;
        //     DataManager.Instance.PlayerDB.entryTicket.awards = false;
        //     DataManager.Instance.PlayerDB.entryTicketAmount += 1;
        //     UIManager.Instance.OpenEntryTicket(DataManager.Instance.PlayerDB.entryTicketAmount);
        // }
    }

    private *HideAndSeekEvent() {
        // while (true) {
        //     yield null;
        //     if (DataManager.Instance?.IsGetPlayerDB) break;
        // }

        if (DataManager.Instance.PlayerDB.isHSManager == false) return;

        const spot =
            this.hideAndSeek[
                Mathf.Floor(Random.Range(0, this.hideAndSeek.length))
            ];
        const character =
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;

        yield new WaitForSeconds(5);
        character.Teleport(spot.transform.position, spot.transform.rotation);

        const iterateTime = 60;
        const waitTime = new WaitForSeconds(1);
        yield waitTime;

        for (let i = 0; i < iterateTime; i++) {
            if (i % 2 == 0)
                character.MoveContinuously(
                    spot.transform.TransformDirection(Vector3.forward)
                );
            else
                character.MoveContinuously(
                    spot.transform.TransformDirection(Vector3.back)
                );

            yield waitTime;
        }

        character.StopMoving();
        // character.StateMachine.Stop();
        yield new WaitForSeconds(3);

        const randomIds = [
            // "com.kofice.kwonderland",
            "com.kofice.kwonderdrama",
            "com.kofice.kwonderlandpop",
            "com.kofice.kwonderawards",
        ];

        const id = randomIds[Mathf.Floor(Random.Range(0, 3))];
        console.log(id);
        ZepetoWorldContent.MoveToWorld(id, (errCode, errMsg) => {
            const onErrId = randomIds[Mathf.Floor(Random.Range(0, 3))];
            ZepetoWorldContent.MoveToWorld(onErrId, (errC, errM) => {});
        });
    }

    /*** Http Data Connection Service ***/
    /* GET */
    private SendRequest_GET() {
        const data = new RoomData();
        data.Add(EVENT_MESSAGE.METHOD, EVENT_MESSAGE.GET);
        data.Add(
            EVENT_MESSAGE.URL,
            `${EVENT_MESSAGE.GET_URL}${WorldService.userId}`
        );
        MultiplayManager.instance.room.Send(
            EVENT_MESSAGE.HTTP,
            data.GetObject()
        );
        console.log("[GameManager] Try Send Request a Data.....");
    }

    public ReceiveEquipSignal(data: RoomData, equip: boolean) {
        if (equip)
            MultiplayManager.instance.room.Send(
                EVENT_MESSAGE.Equip,
                data.GetObject()
            );
        else
            MultiplayManager.instance.room.Send(
                EVENT_MESSAGE.Unequip,
                data.GetObject()
            );
    }

    public ReceiveTourBalloonSignal(isTour: boolean) {
        const data = new RoomData();
        data.Add(EVENT_MESSAGE.IsTour, isTour);

        MultiplayManager.instance.room.Send(
            EVENT_MESSAGE.TourState,
            data.GetObject()
        );
    }

    public SetTourBalloonState(isPlay: boolean) {
        const data = new RoomData();
        // data.Add(SendMessage.)
    }

    // public SendUpdateRank(rankType: RankData) {
    //     const data = new RoomData();
    //     data.Add(SendName.Type, rankType);
    //     MultiplayManager.instance.room.Send(MESSAGE.Leaderboard_Update, data.GetObject());
    // }

    /* Score Update */
    public PlayScoreUpdate(score: number) {
        if (
            !MultiplayManager.instance.room ||
            !MultiplayManager.instance.room.IsConnected
        )
            return;
        MultiplayManager.instance.room.Send(EVENT_MESSAGE.Play_Score, score);
    }

    /** HorrorZone Function */

    /* Send Teleport Target Zone */
    public SendTeleportZone(targetZone: ZoneType) {
        // this.LocalPlayerControllerSet(false);
        const data = new RoomData();
        data.Add(EVENT_MESSAGE.ZoneType, targetZone);
        MultiplayManager.instance.room.Send(
            EVENT_MESSAGE.Teleport,
            data.GetObject()
        );
    }

    public TeleportSignalReceived(ownerSessionId: string, zoneType: ZoneType) {
        this.teleportController.TeleportPlayer(ownerSessionId, zoneType);
    }

    public HorrorZoneEnter() {
        this.cameraController.SetHorrorCamera(true);

        const myCharacter =
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        const characterPos = myCharacter.transform.position;
        ZepetoPlayers.instance.ZepetoCamera.transform.RotateAround(
            characterPos,
            Vector3.up,
            180
        );

        UIManager.Instance.HorrorGamePanelVisibler(true);
        this.ZoneObjectActivator(ZoneType.HorrorZoneEntrance);
    }

    public HorrorZoneExit() {
        this.cameraController.SetHorrorCamera(false);
        UIManager.Instance.HorrorGamePanelVisibler(false);
        //TODO
        this.ZoneObjectActivator(ZoneType.Main);
    }

    /* Zones Object Activator */
    private ZoneObjectActivator(zone: ZoneType) {
        switch (+zone) {
            case ZoneType.HorrorZoneExit:
                // this.ObjectActivator(this.mainZoneObjects, true);
                this.ObjectActivator(this.horrorZoneObjects, false);
                break;

            case ZoneType.HorrorZoneEntrance:
                // this.ObjectActivator(this.mainZoneObjects, false);
                this.ObjectActivator(this.horrorZoneObjects, true);
                break;

            case ZoneType.NULL:
                // this.ObjectActivator(this.mainZoneObjects, false);
                this.ObjectActivator(this.horrorZoneObjects, false);
                break;
        }
    }

    private ObjectActivator(objects: GameObject[], active: boolean) {
        for (const object of objects) {
            object.SetActive(active);
        }
    }

    public Horror_SetLocalRankUI(record: number) {
        LeaderBoardManager.Instance.Horror_SetLocalRankUI(record);
        UIManager.Instance.Open_Horror_ResultUI();
    }
}
