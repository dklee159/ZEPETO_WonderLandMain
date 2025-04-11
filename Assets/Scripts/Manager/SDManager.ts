import { GameObject, Transform, Sprite, Mathf, Random, Vector3, Animator, WaitUntil } from 'UnityEngine';
import { Image, Text, Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoCharacter, ZepetoPlayers, KnowSockets } from 'ZEPETO.Character.Controller';
import { MESSAGE, PlayerDB, SDName, SD, WonderCollection, WonderCollectionList } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import TargetFollower from '../Utils/TargetFollower';
import MultiplayManager from '../../ZepetoScripts/Multiplay/MultiplayManager';
import { RoomData } from 'ZEPETO.Multiplay';
import DataManager from '../Manager/DataManager';
import LocalizationController from '../../ZepetoScripts/Localize/LocalizationController';

export default class SDManager extends ZepetoScriptBehaviour {
    private static _instance : SDManager = null;
    public static get Instance() : SDManager {
        if(this._instance === null) {
            this._instance = GameObject.FindObjectOfType<SDManager>();
            if(this._instance === null) {
                this._instance = new GameObject(SDManager.name).AddComponent<SDManager>();
            }
        }
        return SDManager._instance;
    }
    
    @Header("SD Offset")
    @SerializeField() private offsetX : number = 0;
    @SerializeField() private offsetY : number = 0;
    @SerializeField() private offsetZ : number = 0;

    @Header("UI")
    @SerializeField() private siwooHasUI : Transform;
    @SerializeField() private yubinHasUI : Transform;
    @SerializeField() private gabinHasUI : Transform;
    @SerializeField() private jiaHasUI : Transform;
    @SerializeField() private hajunHasUI : Transform;

    @Header("Popup")
    @SerializeField() private popupUI : GameObject;
    @SerializeField() private popupSDName : Text;
    @SerializeField() private popupSDImage : Image;
    @SerializeField() private popupCloseBtn : Button;
    @SerializeField() private popupConfirmBtn : Button;

    @Header("Character")
    @SerializeField() private characterParent : Transform;
    @SerializeField() private SDSiwoo : GameObject;
    @SerializeField() private SDYubin : GameObject;
    @SerializeField() private SDGabin : GameObject;
    @SerializeField() private SDJia : GameObject;
    @SerializeField() private SDHajun : GameObject;

    @Header("Sprite")
    @SerializeField() private SDSiwooSprite : Sprite;
    @SerializeField() private SDYubinSprite : Sprite;
    @SerializeField() private SDGabinSprite : Sprite;
    @SerializeField() private SDJiaSprite : Sprite;
    @SerializeField() private SDHajunSprite : Sprite;

    @Header("Debug")
    @SerializeField() private getTestBtn : Button;
    @SerializeField() private getBadge : Button;

    private playerDB : PlayerDB;
    private wonderCollectionDB : WonderCollection[] = [];
    private sdCharacterDB : SD[] = [];
    private offset : Vector3 = Vector3.zero;
    private sdMap : Map<SDName, SDInfo> = new Map<SDName, SDInfo>();
    private sdCharMap : Map<string, GameObject> = new Map<string, GameObject>();
    private targetMap : Map<string, Transform> = new Map<string, Transform>();
    
    private sdNames : number[] = [];
    private sdSprites : Sprite[] = [];

    private readonly sdNameSiwoo : number = 21086;
    private readonly sdNameYubin : number = 21087;
    private readonly sdNameGabin : number = 21088;
    private readonly sdNameJia : number = 21089;
    private readonly sdNameHajun : number = 21090;

    Awake() {
        if(SDManager._instance !== null && SDManager._instance !== this) {
            GameObject.Destroy(this.gameObject);
        }
        else {
            SDManager._instance = this;
        }
    }

    Start() {
        this.offset = new Vector3(this.offsetX, this.offsetY, this.offsetZ);

        MultiplayManager.instance.multiplay.RoomJoined += room => {
            room.AddMessageHandler(MESSAGE.EquipSD, (message) => {
                const sessionId = message.SessionId;
                const sdIndex = message.SDIndex;
                
                this.OnSDEquip(sessionId, sdIndex as SDName);
            });
            room.AddMessageHandler(MESSAGE.UnequipSD, (message) => {
                const sessionId = message.SessionId;
                const sdIndex = message.SDIndex;

                this.OnSDUnequip(sessionId, sdIndex as SDName);
            });
            room.AddMessageHandler(MESSAGE.VisibleSD, (sessionId) => {
                this.OnVisible(sessionId.toString());
            });
            room.AddMessageHandler(MESSAGE.InvisibleSD, (sessionId) => {
                this.OnInvisible(sessionId.toString());
            });
        }

        ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId) => {
            const player = ZepetoPlayers.instance.GetPlayer(sessionId);
            const character = player.character;
            const headPosition = character.GetSocket(KnowSockets.HEAD_UPPER).position;
            const ft = new GameObject("FollowTarget").transform;
            ft.parent = character.transform;
            ft.position = headPosition + this.offset;
            ft.transform.Rotate(new Vector3(0, 180, 0));

            this.targetMap.set(sessionId, ft);
        });

        ZepetoPlayers.instance.OnRemovedPlayer.AddListener((sessionId) => {
            const sdChar = this.sdCharMap.get(sessionId);
            if(sdChar) GameObject.Destroy(sdChar);
            const target = this.targetMap.get(sessionId);
            this.targetMap.delete(sessionId);
            GameObject.Destroy(target);
        });

        this.sdNames[+SDName.Siwoo] = this.sdNameSiwoo;
        this.sdNames[+SDName.Yubin] = this.sdNameYubin;
        this.sdNames[+SDName.Gabin] = this.sdNameGabin;
        this.sdNames[+SDName.Jia] = this.sdNameJia;
        this.sdNames[+SDName.Hajun] = this.sdNameHajun;

        this.sdSprites[+SDName.Siwoo] = this.SDSiwooSprite;
        this.sdSprites[+SDName.Yubin] = this.SDYubinSprite; 
        this.sdSprites[+SDName.Gabin] = this.SDGabinSprite; 
        this.sdSprites[+SDName.Jia] = this.SDJiaSprite; 
        this.sdSprites[+SDName.Hajun] = this.SDHajunSprite; 

        this.popupCloseBtn.onClick.AddListener(() => {
            this.popupUI.gameObject.SetActive(false);
        });
        this.popupConfirmBtn.onClick.AddListener(() => {
            this.popupUI.gameObject.SetActive(false);
        });

        if(this.getTestBtn) this.getTestBtn.onClick.AddListener(() => {
            this.GetRandomCharacter();
        });

        if(this.getBadge) this.getBadge.onClick.AddListener(() => {
            // DataManager.instance.AddBadge();
        });
    }

    public Init(playerDB : PlayerDB) {
        this.playerDB = playerDB;
        this.wonderCollectionDB = this.playerDB.wonderCollection;
        this.sdCharacterDB = this.playerDB.SDCharacter;

        this.InitCharacter(SDName.Siwoo);
        this.InitCharacter(SDName.Yubin);
        this.InitCharacter(SDName.Gabin);
        this.InitCharacter(SDName.Jia);
        this.InitCharacter(SDName.Hajun);

        for (const sd of this.sdCharacterDB) {
            if(sd.Equip) {
                this.EquipSD(sd.Index as SDName);
            }
            this.SetEquipUI(this.sdMap.get(sd.Index).UI, sd.Equip);
        }

        MultiplayManager.instance.room.Send(MESSAGE.InstantiatedSD);
    }

    private InitCharacter(sdName : SDName) {
        let ui : Transform;
        let char : GameObject;
        switch(sdName) {
            case SDName.Siwoo:
                ui = this.siwooHasUI;
                char = this.SDSiwoo;
                break;
            case SDName.Yubin:
                ui = this.yubinHasUI;
                char = this.SDYubin;
                break;
            case SDName.Gabin:
                ui = this.gabinHasUI;
                char = this.SDGabin;
                break;
            case SDName.Jia:
                ui = this.jiaHasUI;
                char = this.SDJia;
                break;
            case SDName.Hajun:
                ui = this.hajunHasUI;
                char = this.SDHajun;
                break;
            default:
                break;
        }

        ui.GetComponent<Button>().onClick.AddListener(() => {
            this.OnSDBtnClick(sdName);
        });

        

        this.sdMap.set(sdName, {UI : ui, Character : char, Index : +sdName});
        this.SetHasCharacter(sdName);
    }

    public SetHasCharacter(sdName : SDName) {
        const sdInfo = this.sdMap.get(sdName);
        const ui = sdInfo.UI;
        const sd = this.sdCharacterDB[sdInfo.Index];

        ui.gameObject.SetActive(sd.Has);
    }

    public OnAddBadge() {
        if(this.HasAll()) return;
        
        let hasCount : number = 0;
        this.wonderCollectionDB.forEach((wonderCollection : WonderCollection, index : number) => {
            if(wonderCollection.id !== WonderCollectionList.Hiddle_Collection) {
                console.log(`${wonderCollection.id} : ${wonderCollection.has}`);
                if(wonderCollection.has) hasCount++;
            }
        });

        console.log(`badge : ${hasCount}`);

        if(hasCount >= 3) {
            this.wonderCollectionDB.forEach((wonderCollection : WonderCollection, index : number) => {
                if(wonderCollection.id !== WonderCollectionList.Hiddle_Collection) {
                    wonderCollection.has = false;
                }
            });
            // DataManager.instance.OnDataChanged();
            this.GetRandomCharacter();
        }
    }

    private HasAll() {
        let count : number = 0;
        this.sdMap.forEach((sdInfo, key) => {
            if(this.sdCharacterDB[sdInfo.Index].Has) count ++;
        });

        console.log(`sd : ${count}`);

        if(count >= this.sdMap.size) return true;
        else return false;
    }

    private GetRandomCharacter() {
        const randomNum = Mathf.Floor(Random.Range(0,5));
        const info = this.sdMap.get(randomNum as SDName);
        
        const local = this.popupSDName.GetComponent<LocalizationController>();

        this.popupSDName.text = local.GetTextInArray(this.sdNames[randomNum]);
        this.popupSDImage.sprite = this.sdSprites[randomNum];

        if(!this.sdCharacterDB[info.Index].Has) {
            this.sdCharacterDB[info.Index].Has = true;
            // DataManager.instance.OnDataChanged();
            this.SetHasCharacter(randomNum as SDName);
        }
        this.StartCoroutine(this.ShowCollectResult());
    }

    private * ShowCollectResult() {
        const popup = this.popupUI.transform.GetChild(0);
        popup.localScale = Vector3.zero;
        this.popupUI.gameObject.SetActive(true);
        yield new WaitUntil(() => popup.gameObject.activeInHierarchy);

        const popupAnimator = popup.GetComponent<Animator>();
        popupAnimator.SetTrigger("Active");
    }

    private OnSDBtnClick(sdName : SDName) {
        const sd = this.sdMap.get(sdName);
        if(this.sdCharacterDB[sd.Index].Equip) {
            this.UnequipSD(sdName);
        }
        else {
            this.EquipSD(sdName);
        }
    }

    public EquipSD(sdName : SDName) {
        this.sdMap.forEach((sdInfo : SDInfo, key : SDName) => {
            if(key !== sdName) {
                this.UnequipSD(key);
            }
        });

        const sd = this.sdMap.get(sdName);
        const ui = sd.UI;

        if(this.sdCharacterDB[sd.Index].Has) {
            this.sdCharacterDB[sd.Index].Equip = true;
            this.SetEquipUI(ui, true);
            const data = new RoomData();
            data.Add("sdIndex", +sdName);
            // DataManager.instance.OnDataChanged();
            MultiplayManager.instance.room.Send(MESSAGE.EquipSD, data.GetObject());
        }
    }

    private UnequipSD(sdName : SDName) {
        const sd = this.sdMap.get(sdName);
        if(this.sdCharacterDB[sd.Index].Has && this.sdCharacterDB[sd.Index].Equip) {
            this.SetEquipUI(sd.UI, false);
            this.sdCharacterDB[sd.Index].Equip = false;
            // DataManager.instance.OnDataChanged();
            const data = new RoomData();
            data.Add("sdIndex", +sdName);
            MultiplayManager.instance.room.Send(MESSAGE.UnequipSD, data.GetObject());
        }
    }

    private OnSDEquip(sessionId : string, sdName : SDName) {
        const player = ZepetoPlayers.instance.GetPlayer(sessionId);
        const char = player.character;
        const headPos = char.GetSocket(KnowSockets.HEAD_UPPER).position;
        const newPos = headPos + this.offset;
        const sd = this.sdMap.get(sdName);
        const sdChar = GameObject.Instantiate<GameObject>(sd.Character, this.characterParent);
        sdChar.transform.position = newPos;
        sdChar.GetComponent<TargetFollower>().SetTarget(this.targetMap.get(sessionId));
        sdChar.GetComponent<TargetFollower>().FollowOn();

        this.sdCharMap.set(sessionId, sdChar);
    }

    private OnSDUnequip(sessionId : string, sdName : SDName) {
        const player = ZepetoPlayers.instance.GetPlayer(sessionId);
        
        const sdChar = this.sdCharMap.get(sessionId);
        if(sdChar) {
            GameObject.Destroy(sdChar);
            this.sdCharMap.delete(sessionId);
        }
    }

    public Visible() {
        MultiplayManager.instance.room.Send(MESSAGE.VisibleSD);
    }

    public Invisible() {
        MultiplayManager.instance.room.Send(MESSAGE.InvisibleSD);
    }

    private OnVisible(sessionId : string) {
        const sdChar = this.sdCharMap.get(sessionId);
        if(sdChar) {
            sdChar.transform.GetChild(0).gameObject.SetActive(true);
        }
    }

    private OnInvisible(sessionId : string) {
        const sdChar = this.sdCharMap.get(sessionId);
        if(sdChar) {
            sdChar.transform.GetChild(0).gameObject.SetActive(false);
        }
    }

    private SetEquipUI(ui : Transform, equip : boolean) {
        ui.GetChild(0).gameObject.SetActive(equip);
    }
}


interface SDInfo {
    UI : Transform,
    Character : GameObject,
    Index : number
}
