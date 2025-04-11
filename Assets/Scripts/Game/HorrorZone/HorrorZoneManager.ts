import { AnimationClip, Animator, BoxCollider, Collider, Coroutine, GameObject, HumanBodyBones, Mathf, Sprite, Time, Transform, Vector3, WaitForEndOfFrame, WaitForSeconds } from 'UnityEngine';
import { RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { TextMeshProUGUI } from 'TMPro';
import { Button, Image } from 'UnityEngine.UI';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import HorrorTriggerController from './HorrorTriggerController';
import ZTween from '../../ZTween/ZTween';
import { Ease } from '../../ZTween/EaseManager';
import UIManager from '../../Manager/UIManager';
import DataManager from '../../Manager/DataManager';
import GameManager from '../../GameManager';
import { Anim, DATA_TYPE, ERROR, EVENT_MESSAGE, WonderState, ZoneType } from '../../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import MultiplayManager from '../../../ZepetoScripts/Multiplay/MultiplayManager';
import QuestManager from '../../Manager/QuestManager';

export default class HorrorZoneManager extends ZepetoScriptBehaviour {

    private static _instance: HorrorZoneManager;
    public static get Instance(): HorrorZoneManager {
        if (!HorrorZoneManager._instance) {
            const managerObj = GameObject.Find("HorrorZoneManager");
            if (managerObj) HorrorZoneManager._instance = managerObj.GetComponent<HorrorZoneManager>();
        }
        return HorrorZoneManager._instance;         
    }

    @Header("Horror Game")
    @SerializeField() private ghostsGroup: Transform;
    @SerializeField() private itemGroup: Transform;
    @SerializeField() private effects: Transform;
    // @SerializeField() private _finishController: Transform;
    @SerializeField() private fireBall: GameObject;
    @SerializeField() private destroyList: Transform;
    @SerializeField() private pool: Transform;
    @SerializeField() private burn: GameObject;
    @SerializeField() private ghostDolls: GameObject[] = [];
    private ghosts: GhostDatas[] = [];
    private fireBalls: Transform[] = [];
    // @SerializeField() private _finishController: Transform;
    // private finishController: HorrorTriggerController;
    private items: HorrorTriggerController[] = [];
    private targetedMob : HorrorTriggerController;
    private burningHand: Transform;
    private burns: Animator[] = [];

    @SerializeField() private fireBallAnimation: AnimationClip;
    private fireButtonAnim: Animator;

    public GetFireBallSpeed() : number { return this.fireBallSpeed; }
    public GetFireBallCoolTime() : number { return this.coolTime; }
    public GetEffects(): Transform { return this.effects; }
    
    @SerializeField() private fireBallSpeed: number = 7;
    @SerializeField() private coolTime: number = 4;
    private isWaitCoolTime: boolean = false;
    private damageWaitCoolTime: WaitForSeconds;

    @Header("Horror Battle")
    @SerializeField() private ridarParent: GameObject;
    @SerializeField() private ridar: GameObject;
    private _equipedRidar: GameObject;
    @SerializeField() private slowSupporter: number;
    private _inRanges: number[] = [];

    private isPlay: boolean = false;

    private readonly PoolCount: number = 5;
    private _mobs: { [key: number]: HorrorTriggerController } = {};

    @HideInInspector() public isFireBall: boolean = false;

    @Header("* Horror Game UIs")
    @SerializeField() private horrorGameUI: Transform;
    @SerializeField() private heartImage: Sprite;
    @SerializeField() private breakImage: Sprite;
    @SerializeField() private timerText: TextMeshProUGUI;
    private hp_heart: Image[] = [];
    // private lampImage: Image;
    private fireImage: Image;
    private fire_Lock: GameObject;
    private fireButton : Button;    

    @Header("Time Attack")
    private timer: number = 0;
    private timeData: TimerData = TimerData.Stop;
    private isTimer: boolean = false;
    private gameTimer: Coroutine;
    private damageCoroutine: Coroutine;

    /** Game Configs */
    private _hp: number = 0;
    public get hp(): number { return this._hp; }
    public set hp(value: number) { this._hp = Mathf.Clamp(value, 0, this.maxHp); }
    public get maxHp(): number { return this.hp_heart.length; };

    private followCoroutine: Coroutine = null;

    ///Object Pool
    private get pool_Burn(): Animator {
        if(!this.burns || this.burns.length < this.PoolCount) {
            const newClone = GameObject.Instantiate<GameObject>(this.burn, this.pool);
            const anim = newClone.GetComponent<Animator>();
            this.burns.push(anim);
            return anim;
        }
        const burn = this.burns.splice(0, 1);
        this.burns.push(burn[0]);
        return burn[0];
    }

    public get pool_FireBall(): Transform {
        if (!this.fireBalls || this.fireBalls.length < this.PoolCount) {
            const newClone = GameObject.Instantiate<GameObject>(this.fireBall, this.pool).transform;
            this.fireBalls.push(newClone);
            return newClone;
        }
        const fireBall = this.fireBalls.splice(0, 1);
        this.fireBalls.push(fireBall[0]);
        return fireBall[0];
    }

    /* GameManager */
    public RemoteStart() {       

        /* Set System */
        this.SetItems();
        this.SetGhosts();
        this.SetEffects();
        // this.SetControllers(); // TODO 이거 왜 있는거지??????
        // this.SetTeleporters();

        /* Set UIs */
        this.SetHorrorUIs();

        /* Finish Start */
        this.InitHorrorZoneSystem();
    }

    private Awake() {
        HorrorZoneManager._instance = this;        
    }

    private SetItems() {
        // Item
        for (let i = 0; i < this.itemGroup.childCount; i++) {
            const controller = this.itemGroup.GetChild(i).GetComponent<HorrorTriggerController>();
            if (controller) {
                controller.RemoteStart();
                this.items.push(controller);
            }
        }
    }

    private SetGhosts() {
        // Ghost
        const Ghost_Reaper = "Ghost_Reaper";
        for (let i = 0; i < this.ghostsGroup.childCount; i++) {
            const ghost = this.ghostsGroup.GetChild(i);
            const controller = ghost.GetChild(0).GetComponent<HorrorTriggerController>();
            const moveAnim = ghost.GetComponent<Animator>();
            const ghostColliders = ghost.GetComponentsInChildren<BoxCollider>();
            const ghostModel = ghost.transform.GetChild(0).GetChild(0);
            const ghostModelAnim = ghostModel.GetComponent<Animator>();
            const ghostDatas: GhostDatas = {
                gameObject: ghost.gameObject,
                transform: ghost,
                controller: controller,
                power: 1,
                moveAnimator: moveAnim,
                modelAnimator: ghostModelAnim,
                colliders: ghostColliders,
                effectTarget: ghost.transform.GetChild(0).GetChild(0).GetChild(0).GetChild(0),
            };
            moveAnim.SetInteger(Anim.State, controller.index);

            if (ghost.name.includes(Ghost_Reaper)) ghostDatas.power = 2;
            
            // controller.RemoteStart(this);
            this.ghosts.push(ghostDatas);
        }
    }

    private SetEffects() {
        // Effect
        // this.lamp = this.effects.GetChild(0);
        this.burningHand = this.effects.GetChild(1);
    }

    // private SetControllers() {
    //     const finishController = this._finishController.GetComponent<HorrorTriggerController>();
    //     this.finishController = finishController;
    //     this._finishController = null;
    //     this.finishController.RemoteStart(this);
    // }


    public InitGame() { 
        this.TeleportPlayer();
    }

    public GameStart() {
        if(this.isTimer || this.isPlay) return;

        this.timer = 0;
        this.isPlay = true;
        this.isTimer = true;
        this.timeData = TimerData.Start;

        if (this.gameTimer) this.StopCoroutine(this.gameTimer);
        this.gameTimer = this.StartCoroutine(this.GameTimer());
    }

    private TeleportPlayer() {
        const data = new RoomData();
        data.Add(EVENT_MESSAGE.ZoneType, ZoneType.HorrorZoneEntrance);
        MultiplayManager.instance.room.Send(EVENT_MESSAGE.Teleport, data.GetObject());
    }

    /* Set HP UI */
    private SetHorrorUIs() {
        const heartPointPanel = this.horrorGameUI.GetChild(0);
        // this.timerPanel = this.horrorGameUI.GetChild(1);
        const itemPanel = this.horrorGameUI.GetChild(2);

        // HP
        for (let i = 0; i < heartPointPanel.childCount; i++) {
            const heart = heartPointPanel.GetChild(i).GetComponent<Image>();
            heart.sprite = this.heartImage;
            this.hp_heart.push(heart);
        }

        // Timer

        // Item
        // const lampButton = itemPanel.GetChild(0).GetComponent<Button>();
        const fireButton = itemPanel.GetChild(1).GetComponent<Button>();
        this.fire_Lock = itemPanel.GetChild(2).gameObject;
        // this.lampImage = lampButton.transform.GetComponent<Image>();
        this.fireImage = fireButton.transform.GetComponent<Image>();
        this.fireButtonAnim = fireButton.transform.GetComponent<Animator>();

        // this.lampImage.enabled = false;
        this.fireImage.enabled = false;

        // lampButton.onClick.AddListener(() => {
        //     if(!this.lampImage.enabled) return;
        //     this.LampEquip(!this.isHoldLamp);
        //     this.isHoldLamp = !this.isHoldLamp;
        // });

        this.fireButton = fireButton;
        this.fireButton.interactable = true;

        fireButton.onClick.AddListener(() => {
            if(!this.fireImage.enabled) return;
            if(this.isWaitCoolTime) return;
            if(this.isFireBall) return;
            this.StartCoroutine(this.FireBall());
            this.StartCoroutine(this.CoolTimeDisable());
        });
        
        itemPanel.gameObject.SetActive(true);
        this.fire_Lock.gameObject.SetActive(true);
    }

    /* Item Fire */
    private * FireBall() {
        if(this.isFireBall) return;
        this.isFireBall = true;

        /* Character Set */
        // GameManager.instance.LocalPlayerControllerSet(false);
        DataManager.Instance.SetWonderState(WonderState.H_Attack, true);

        /* Button Animation */
        this.fireButtonAnim.SetTrigger(Anim.Active);

        /* FireBall Shoot */        
        //const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.transform;
        // const fireBall = this.pool_FireBall;
        // fireBall.position = character.position + (Vector3.up *0.5) + character.forward;
        // fireBall.rotation = character.rotation;
        // fireBall.gameObject.SetActive(true);
        // const target = fireBall.GetChild(0);
        let timer = 0;
        const waitAnimation = Mathf.Floor(this.fireBallAnimation.length);
        while(true) {
            yield null;
            timer += Time.deltaTime;
            if (timer > waitAnimation) break;
        }

        /* Character Reset */
        // GameManager.instance.LocalPlayerControllerSet(true);
        DataManager.Instance.SetWonderState(WonderState.H_Attack, false);

        /* Wait FireBall Move */
        if (this._inRanges.length > 0) {
            this.StartCoroutine(this.fireFireballCoroutine(timer));
        } else {
            const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.transform;
            const fireBall = this.pool_FireBall;
            fireBall.position = character.position + Vector3.up * 0.5 + character.forward;
            fireBall.rotation = character.rotation;
            fireBall.gameObject.SetActive(true);
            const target = fireBall.GetChild(0);

            while (true) {
                yield null;
                timer += Time.deltaTime;
                fireBall.position = Vector3.MoveTowards(
                    fireBall.position,
                    target.position,
                    Time.deltaTime * this.fireBallSpeed
                );
                if (timer > this.coolTime) break;
            }

            /* Finish */
            fireBall.position = this.effects.position;
            fireBall.gameObject.SetActive(false);

            this.isFireBall = false;
        }
    }

    *fireFireballCoroutine(timer : number) {
        this.targetedMob = null;
        for( const item of this._inRanges ) {

        if( this._mobs[item] != null ) {
            if( this._mobs[item].isTargeted == false ) {
                this.targetedMob = this._mobs[item];
                break;
            }  
        }
          // else
          // {
          //   mgLog.error(`item not found ..${item}`);
          // }
        }


        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.transform;
        const fireBall = this.pool_FireBall;
        fireBall.position = character.position + Vector3.up * 0.5 + character.forward;
        fireBall.rotation = character.rotation;
        fireBall.gameObject.SetActive(true);


        if (this.targetedMob == null) {
            const target = fireBall.GetChild(0);

            while (true) {
                yield null;
                timer += Time.deltaTime;
                fireBall.position = Vector3.MoveTowards(
                    fireBall.position,
                    target.position,
                    Time.deltaTime * this.GetFireBallSpeed()
                );
                if (timer > this.GetFireBallCoolTime()) break;
            }

            /* Finish */
            fireBall.position = this.GetEffects().position;
            fireBall.gameObject.SetActive(false);

            HorrorZoneManager.Instance.isFireBall = false;
        }
        else
        {
            this.targetedMob.isTargeted = true;

            this.StartCoroutine( this.LaunchTween(fireBall) );
            

        }
    }

    private *CoolTimeDisable() {
        this.fireButton.interactable = false;
        yield new WaitForSeconds(this.coolTime);
        this.fireButton.interactable = true;
    }

    *LaunchTween( fireBall : Transform ) {
        let targetPos = this.targetedMob.transform.position + (Vector3.up * 0.5);
        const dis = Vector3.Distance( fireBall.position, targetPos);
        const ltime = Mathf.LerpUnclamped( 0.01, 0.05, dis);

        //let adjustTween = ZTween.VectorMoveTo(adjustPos, targetPos, ltime).SetEase(Ease.Linear);
        

        let tween = ZTween.TransfomMoveTo(fireBall, targetPos, ltime * this.slowSupporter).SetEase(Ease.Linear);
        tween.SetOnComplete( () => { 
        
        HorrorZoneManager.Instance.isFireBall = false;
        this.targetedMob.onHitted();

        fireBall.gameObject.SetActive(false);
        });

        const curve = 4;  
        for ( let i = 1; i < curve+1; i++) {
            yield new WaitForSeconds(ltime * i / curve);
            targetPos = this.targetedMob.transform.position + (Vector3.up *0.5);
          // old
            tween.SetEndVal(targetPos); 

          // new
          // adjustTween.SetEndVal(targetPos); 
          // tween.SetEndVal(adjustPos);  
        }  
    }

    public GameReady() {
        console.log("GAME READY FOR HORRORZONE")
        this.InitHorrorZoneSystem();
    }

    private InitHorrorZoneSystem() {
        // Ghost
        for (const ghost of this.ghosts) {
            ghost.gameObject.SetActive(false);
            ghost.moveAnimator.SetBool(Anim.Active, false);
            for (const collider of ghost.colliders) collider.enabled = false;
        }

        // Item
        for (const item of this.items) {
            item.gameObject.SetActive(false);
        }
        // this.lampImage.enabled = false;
        this.fireImage.enabled = false;
        this.fire_Lock.SetActive(true);

        // Effect
        // this.lamp.SetParent(this.effects);
        // this.lamp.position = this.effects.position;
        // this.lamp.gameObject.SetActive(false);

        this.burningHand.SetParent(this.effects);
        this.burningHand.position = this.effects.position;
        this.burningHand.localScale = Vector3.one;
        this.burningHand.gameObject.SetActive(false);

        // Hp
        this.hp = this.maxHp;
        for(const heart of this.hp_heart) {
            heart.sprite = this.heartImage;
        }
        
        // Stop Timer
        this.StopCoroutine(this.GameTimer());
        if (this.gameTimer) this.StopCoroutine(this.gameTimer);
        this.gameTimer = null;

        // Stop Damage
        if (this.damageCoroutine) this.StopCoroutine(this.damageCoroutine);
        this.damageCoroutine = null;
        this.isWaitCoolTime = false;

        // Timer
        this.timer = 0;
        this.isPlay = false;
        this.isTimer = false;
        this.timeData = TimerData.Stop;
        this.SetText(this.timer);

        // Destory Items
        for (let i = 0; i < this.destroyList.childCount; i++) {
            const item = this.destroyList.GetChild(i).gameObject;
            GameObject.Destroy(item);
        }

        // BattleManager
        // this.OnGameLeave();
    }

    private *GameTimer() {
        const wait = new WaitForSeconds(2);

        this.OnGameEnter();
        UIManager.Instance.TextAnimate(DATA_TYPE.READY);
        yield wait;
        
        UIManager.Instance.TextAnimate(DATA_TYPE.START);
        
        yield wait;
        UIManager.Instance.TextAnimationOFF();
        
        this.ReadyGameSystem();
        // UIManager.Instance.LocalPlayerControllerSet(true);


        while(true) {
            yield null;
            if(!this.isTimer) break;

            /* Update Timer Text */
            switch (+this.timeData) {
                case TimerData.Start :
                    this.timer += Time.deltaTime;
                    this.SetText(this.timer);
                    break;

                case TimerData.Pause :
                    break;

                case TimerData.Stop :
                    this.timer = 0;
                    break;

                case TimerData.Reset :
                    this.timer = 0;
                    this.SetText(this.timer);
                    this.timeData = TimerData.Start;
                    break;
            }
        }
        
        this.StopCoroutine(this.GameTimer());
        if (this.gameTimer) this.StopCoroutine(this.gameTimer);
        this.gameTimer = null;
    }

    private OnGameEnter() {        
        this._equipedRidar = GameObject.Instantiate(this.ridar, this.ridarParent.transform) as GameObject;
        this.followCoroutine = this.StartCoroutine(this.FollowTargetRidar());
    }

    private *FollowTargetRidar() {
        const _waitForFrame: WaitForEndOfFrame = new WaitForEndOfFrame();
        const _srcCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject

        while (true) {
            this._equipedRidar.transform.position = _srcCharacter.transform.position;
            this._equipedRidar.transform.rotation = _srcCharacter.transform.rotation;
            yield _waitForFrame;
        }
    }

    private ReadyGameSystem() {        
        // Ghost
        for (const ghost of this.ghosts) {
            ghost.gameObject.SetActive(true);
            ghost.moveAnimator.SetBool(Anim.Active, true);
            ghost.moveAnimator.SetInteger(Anim.State, ghost.controller.index);
            //console.log(` ${ghost.transform.name} : moveAnim ${ghost.moveAnimator.GetInteger(Anim.State)} == ${ghost.controller.index}`);
            for (const collider of ghost.colliders) collider.enabled = true;
        }

        // Item
        for (const item of this.items) {
            item.gameObject.SetActive(true);
        }

        // Effect
        this.fireBall.SetActive(true);
    }

     /* Time Text Update */
    private SetText(timer: number) {
        const minutes = Mathf.Floor(timer / 60);
        const seconds = Mathf.Floor(timer % 60);
        const millSec = Mathf.Floor((timer * 100) % 100);
        const formattedString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${millSec.toString().padStart(2, '0')}`;
        this.timerText.text = formattedString;
        if (minutes === 60) this.timeData = TimerData.Stop;
        return formattedString;
    }

    private OnGameLeave() {
        if (this.followCoroutine != null) {
            this.StopCoroutine(this.followCoroutine);
            this.followCoroutine = null;
        }
        QuestManager.Instance.OnPlayGame();
        this._inRanges = [];        

        if (this._equipedRidar != null) {
            GameObject.Destroy(this._equipedRidar);
        }
    }

    private OnDeath() {
        this.StartCoroutine(this.StopGame(false));
    }

    private *StopGame(isComplete:boolean) {

        this.OnGameLeave();

        if (!this.isTimer) return;

        this.timeData = TimerData.Pause;
        const time: number = +this.timer;

        // Result
        console.log(`Finished! ${isComplete ? DATA_TYPE.CLEAR : DATA_TYPE.GAME_OVER}`);
        // GameManager.instance.LocalPlayerControllerSet(false);

        // Text Animation
        UIManager.Instance.TextAnimate(isComplete ? DATA_TYPE.CLEAR : DATA_TYPE.GAME_OVER);        
        yield new WaitForSeconds(2);        
        UIManager.Instance.TextAnimationOFF();

        // Teleport
        GameManager.Instance.SendTeleportZone(ZoneType.HorrorZoneExit);

        // Result
        yield new WaitForSeconds(1);
        if (isComplete) GameManager.Instance.Horror_SetLocalRankUI(time);
        // GameManager.instance.LocalPlayerControllerSet(true);
        DataManager.Instance.SetWonderState(WonderState.H_Damaged, false);

        // Finish
        this.InitHorrorZoneSystem();
        this.StopCoroutine(this.StopGame(isComplete));
    }

    /* Add Item */
    public AddItem(itemName:string) {
        if(itemName == HorrorItemType.Lamp) {
            // this.lampImage.enabled = true;
            // this.isHoldLamp = true;
            // this.LampEquip(true);

        } else if(itemName == HorrorItemType.Fire) {
            this.fireImage.enabled = true;
            this.fire_Lock.SetActive(false);
            this.BurningHandEquip(true);
        } 
    }

    private BurningHandEquip(isEquip:boolean) {
        /* Find Character Left Hand */
        if(!ZepetoPlayers.instance.LocalPlayer) return console.error(ERROR.NOT_FOUND_LOCAL_PLAYER);
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        const anim: Animator = character.ZepetoAnimator;
        const bone = anim.GetBoneTransform(HumanBodyBones.RightHand);

        /* BH Tranformation */
        if (isEquip) {
            this.burningHand.gameObject.SetActive(true);
            this.burningHand.SetParent(bone);
            this.burningHand.position = bone.position;
            this.burningHand.rotation = bone.rotation;

        } else {
            this.burningHand.SetParent(this.effects);
            this.burningHand.position = this.effects.position;
            this.burningHand.rotation = this.effects.rotation;
            this.burningHand.localScale = Vector3.one;
            this.burningHand.gameObject.SetActive(false);
        }
    }

    /* Game Clear */
    public GameClear(collider: Collider) {
        this.StartCoroutine(this.StopGame(true));
    }

    /// Game Function
    /* Ghost Damaged */
    public Damage(ghost: GameObject) {
        if(this.isWaitCoolTime) return;
        this.isWaitCoolTime = true;
        this.damageCoroutine = this.StartCoroutine(this.onDamaged(ghost));

        // Ghost Remove
        this.GhostBurn(ghost);
    }

    private *onDamaged(ghost:GameObject) {
        /* Character Set */
        // GameManager.instance.LocalPlayerControllerSet(false);
        DataManager.Instance.SetWonderState(WonderState.H_Damaged, true);

        /* Find Ghost */
        let index = -1;
        for(let i = 0; i < this.ghosts.length; i++) {
            if (this.ghosts[i].gameObject.name == ghost.transform.parent.name) {
                index = i;
                break;
            }
        }
        if (index < 0) return console.error(ERROR.NOT_FOUND_ITEM);

        /* HP Damaged */
        const ghostData = this.ghosts[index];
        for(let i = 0; i < ghostData.power; i++) {
            this.hp--;
            if(this.hp >= 0) this.hp_heart[this.hp].sprite = this.breakImage;
            if(this.hp <= 0) {
                this.OnDeath();
                break;
            }
        }

        /* End onDamaged */
        if(!this.damageWaitCoolTime) this.damageWaitCoolTime = new WaitForSeconds(this.coolTime);
        yield this.damageWaitCoolTime;
        this.isWaitCoolTime = false;
        
        /* Character Set */
        // GameManager.instance.LocalPlayerControllerSet(true);
        DataManager.Instance.SetWonderState(WonderState.H_Damaged, false);
    }

    public addOnRange(intanceId: number) {
        this._inRanges.push(intanceId);
    }

    public removeOnRange(intanceId: number) {
        const indexToDelete = this._inRanges.indexOf(intanceId);
        if (indexToDelete !== -1) {
            this._inRanges.splice(indexToDelete, 1);
        }
    }

    public GhostBurn(ghost: GameObject) {
        this.StartCoroutine(this.GhostDead(ghost));
    }

    private *GhostDead(ghost: GameObject) {
        this.fireBall.gameObject.SetActive(false);

        const wait = new WaitForSeconds(1);

        /* Find Ghost */
        let index = -1;
        for (let i = 0; i < this.ghosts.length; i++) {
            if(this.ghosts[i].gameObject.name == ghost.transform.parent.name) {
                index = i;
                break;
            }
        }
        if (index < 0) return console.error(ERROR.NOT_FOUND_ITEM);

        const ghostData = this.ghosts[index];
        ghostData.moveAnimator.SetBool(Anim.Active, false);
        ghostData.gameObject.SetActive(false);
        for (const collider of ghostData.colliders) collider.enabled = false;

        /* Effect Location */
        const burn = this.pool_Burn;
        burn.transform.position = ghostData.effectTarget.position;
        burn.gameObject.SetActive(true);
        burn.SetTrigger(Anim.Active);

        yield new WaitForSeconds(1);

        const targetDoll = this.ghostDolls[ghostData.controller.ghostType];
        const doll = GameObject.Instantiate(targetDoll, this.destroyList) as GameObject;
        doll.transform.position = burn.transform.position + (Vector3.up *0.5);
        doll.transform.GetChild(0).localScale = Vector3.zero;

        yield new WaitForSeconds(3);

        burn.gameObject.SetActive(false);
    }

    

    public addMob(horrorTriggerController: HorrorTriggerController) {
        this._mobs[horrorTriggerController.gameObject.GetInstanceID()] = horrorTriggerController;
    }

    public removeMob(horrorTriggerController: HorrorTriggerController) {
        delete this._mobs[horrorTriggerController.gameObject.GetInstanceID()];
    }
}

interface GhostDatas {
    gameObject: GameObject,
    transform: Transform,
    controller: HorrorTriggerController,
    power: number,
    moveAnimator: Animator,
    modelAnimator:Animator,
    colliders: BoxCollider[],
    effectTarget: Transform,
}

enum TimerData {
    Start, Pause, Stop, Reset,
}

enum HorrorItemType {
    Lamp = "Lamp", Fire = "Fire",
}