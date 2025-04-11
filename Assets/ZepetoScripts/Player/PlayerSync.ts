import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {RoomBase, RoomData} from 'ZEPETO.Multiplay';
import {ZepetoWorldMultiplay} from "ZEPETO.World";
import {CharacterJumpState, CharacterMoveState, CharacterState, ZepetoPlayer, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import { Object, Animator, AnimatorClipInfo, Resources, AnimationClip, WaitForSeconds, Mathf, WaitForEndOfFrame} from 'UnityEngine';
import {Player} from 'ZEPETO.Multiplay.Schema';
import TransformSyncHelper from '../SyncHelper/TransformSyncHelper';
import { Anim, EVENT_MESSAGE, MESSAGE } from '../SyncHelper/TypeSyncHelper';
import ZepetoPlayersManager from './ZepetoPlayersManager';
import DataManager from '../../Scripts/Manager/DataManager';
import SyncIndexManager from '../SyncIndexManager';

export default class PlayerSync extends ZepetoScriptBehaviour {

    /* Player Sync Properties */
    @HideInInspector() public isLocal: boolean = false;
    @HideInInspector() public player: Player;
    @HideInInspector() public zepetoPlayer: ZepetoPlayer;
    @HideInInspector() public tfHelper: TransformSyncHelper;
    @HideInInspector() public isUseInjectSpeed: boolean = false;
    @HideInInspector() public GetAnimationClipFromResources : boolean = true;
    @HideInInspector() public UseZepetoGestureAPI: boolean = false;

    private readonly _tick: number = 0.04;
    private _animator: Animator;
    private _multiplay: ZepetoWorldMultiplay;
    private _room: RoomBase;

    /* Wonder Properties */
    private prevWonderState: number;

    private Start() {
        this._animator = this.transform.GetComponentInChildren<Animator>();
        this._multiplay = Object.FindObjectOfType<ZepetoWorldMultiplay>();
        this._room = this._multiplay.Room;
        console.log(` **************** isLocal? ${this.isLocal} `);
        if (this.isLocal) {
            this.StartCoroutine(this.SendLocalPlayer(this._tick));
            this.SetLocalCamera();
        } else{
            this.player.OnChange += (_ChangeValue) => this.OnChangedPlayer();
            //If this is not a local character, do not use State Machine.
            this.zepetoPlayer.character.StateMachine.Stop();
        }
    }

    private SetLocalCamera() {
        const camera = ZepetoPlayers.instance.ZepetoCamera.camera;
        camera.tag = "MainCamera";        
    }

    // !isLocal(other player)
    private OnChangedPlayer() {
        if (this.isLocal) return
        const animationParam = this.player.animationParam;
        const animator = this._animator;
        animator.SetInteger(Anim.State, animationParam.State);
        animator.SetInteger(Anim.MoveState, animationParam.MoveState);
        animator.SetInteger(Anim.JumpState, animationParam.JumpState);
        animator.SetInteger(Anim.LandingState, animationParam.LandingState);
        animator.SetFloat(Anim.MotionSpeed, animationParam.MotionSpeed);
        animator.SetFloat(Anim.FallSpeed, animationParam.FallSpeed);
        animator.SetFloat(Anim.Acceleration, animationParam.Acceleration);
        animator.SetFloat(Anim.MoveProgress, animationParam.MoveProgress);
        animator.SetBool(Anim.isSit, animationParam.isSit);
        animator.SetInteger(Anim.WonderState, animationParam.WonderState);
        animator.SetBool(Anim.isHold, animationParam.isHold);        

        //sync gesture
        if (animationParam.State == CharacterState.Gesture && ( this.UseZepetoGestureAPI || this.GetAnimationClipFromResources )) { 
            const clipInfo: AnimatorClipInfo[] = this._animator.GetCurrentAnimatorClipInfo(0);
            const gestureName = this.player.gestureName;
            
            if (!gestureName || clipInfo[0].clip.name === gestureName) return;
            console.log(`Gesture Name : ${gestureName}`);
            console.log(`IsAnimationClipFromResources? ${this.GetAnimationClipFromResources}`);
            console.log(`ClipInfo : ${clipInfo}`);
            let animClip: AnimationClip | null = null;
            if (this.UseZepetoGestureAPI && ZepetoPlayersManager.instance.GestureAPIContents.has(gestureName)) {
                const content = ZepetoPlayersManager.instance.GestureAPIContents.get(gestureName);
                if (!content.IsDownloadedAnimation) {
                    // If the animation has not been downloaded, download it.
                    content.DownloadAnimation(() => {
                        // play animation clip
                        this.zepetoPlayer.character.SetGesture(content.AnimationClip);
                    });                       
                    return;
                } else {
                    animClip = content.AnimationClip;
                }
            } else if(this.GetAnimationClipFromResources)// Resources animation.
                animClip = Resources.Load<AnimationClip>(`Animations/${gestureName}`);
            
            if (animClip == null) { 
                // When the animation is not in the /Asset/Resources file pass
                console.warn(`${gestureName} is null, Add animation in the Resources folder.`);
            } else {
                this.zepetoPlayer.character.SetGesture(animClip);
            }
        }
        
        if(animationParam.State === CharacterState.Teleport){
            this.StartCoroutine(this.WaitTeleportFrame(5));
        }

        const playerAdditionalValue = this.player.playerAdditionalValue;
        this.zepetoPlayer.character.additionalWalkSpeed = playerAdditionalValue.additionalWalkSpeed;
        this.zepetoPlayer.character.additionalRunSpeed = playerAdditionalValue.additionalRunSpeed;
        this.zepetoPlayer.character.additionalJumpPower = playerAdditionalValue.additionalJumpPower;

        //sync interpolation speed
        if (this.isUseInjectSpeed){
            const ySpeed = Mathf.Abs(animationParam.FallSpeed);
            let xzSpeed : number = 0;
            if(animationParam.State == CharacterState.Jump && animationParam.JumpState == CharacterJumpState.JumpIdle){
                xzSpeed = 0;
            } else if (animationParam.MoveState == CharacterMoveState.MoveRun) {
                //1.5 : Run Weight between actual Zepeto character and Unity.
                xzSpeed = this.zepetoPlayer.character.RunSpeed * 1.5 * animationParam.Acceleration;
            } else if (animationParam.MoveState == CharacterMoveState.MoveWalk) {
                //1.25 : Walk Weight between actual Zepeto character and Unity.
                xzSpeed = this.zepetoPlayer.character.WalkSpeed * 1.25 * animationParam.Acceleration;
            } else
                return;
            
            this.tfHelper.moveSpeed = xzSpeed + ySpeed;
        }
    }
    
    //The character's animation synchronization and location synchronization do not occur at the same time, so teleport is executed after a certain frame.
    private *WaitTeleportFrame(waitFrame:number){
        for(let i = 0; i < waitFrame; i++)
            yield new WaitForEndOfFrame();
        this.tfHelper.ForceTarget();
    }

    //isLocal(When it's my character)
    private *SendLocalPlayer(tick: number) {
        const pastIdleCountMax:number = 10;
        let pastIdleCount:number = 0;      

        // /* Set CameraManager */
        // const cam = ZepetoPlayers.instance.ZepetoCamera.camera;
        // const _cameraCon = cam.gameObject.GetComponent<CameraManager>();
        // if(!_cameraCon) cam.gameObject.AddComponent<CameraManager>();
        // UIManager.instance.SetLocalCamera();
        
        while(true) {
            /* Update Player Data */
            DataManager.Instance.PlayerDataUpdate();

            const state = this._animator.GetInteger(Anim.State);
            // Idle status is sent only once.
            const idleChecker = state != CharacterState.Idle || pastIdleCount < pastIdleCountMax;
            const onWonderStateChange = this.onWonderStateChange();            

            // Idle status is sent only once.
            if(idleChecker || onWonderStateChange || SyncIndexManager.DrawDataChanged) {            
                const data = new RoomData();
                const animationParam = new RoomData();
                animationParam.Add(Anim.State, state);
                animationParam.Add(Anim.MoveState, this._animator.GetInteger(Anim.MoveState));
                animationParam.Add(Anim.JumpState, this._animator.GetInteger(Anim.JumpState));
                animationParam.Add(Anim.LandingState, this._animator.GetInteger(Anim.LandingState));
                animationParam.Add(Anim.MotionSpeed, this._animator.GetFloat(Anim.MotionSpeed));
                animationParam.Add(Anim.FallSpeed, this._animator.GetFloat(Anim.FallSpeed));
                animationParam.Add(Anim.Acceleration, this._animator.GetFloat(Anim.Acceleration));
                animationParam.Add(Anim.MoveProgress, this._animator.GetFloat(Anim.MoveProgress));
                animationParam.Add(Anim.isSit, this._animator.GetBool(Anim.isSit));
                animationParam.Add(Anim.isHold, this._animator.GetBool(Anim.isHold));
                animationParam.Add(Anim.WonderState, this._animator.GetInteger(Anim.WonderState));                
                data.Add(MESSAGE.animationParam, animationParam.GetObject());

                // data.Add(MESSAGE.gestureName, SyncIndexManager.GETSURE_ID);
                // console.log(`GestureName is ${this._animator.runtimeAnimatorController.animationClips[1].name}`)
                data.Add("gestureName", this._animator.runtimeAnimatorController.animationClips[1].name ?? null);

                const playerAdditionalValue = new RoomData();
                playerAdditionalValue.Add(MESSAGE.additionalWalkSpeed, this.zepetoPlayer.character.additionalWalkSpeed);
                playerAdditionalValue.Add(MESSAGE.additionalRunSpeed, this.zepetoPlayer.character.additionalRunSpeed);
                playerAdditionalValue.Add(MESSAGE.additionalJumpPower, this.zepetoPlayer.character.additionalJumpPower);
                data.Add(MESSAGE.playerAdditionalValue, playerAdditionalValue.GetObject());

                this._room?.Send(MESSAGE.SyncPlayer, data.GetObject());

                if (SyncIndexManager.DrawDataChanged) SyncIndexManager.DrawDataChanged = false

                /*** Http Data Connection Service ***/
                if(DataManager.Instance.IsGetPlayerDB) {
                    const playerDB = JSON.stringify(DataManager.Instance.PlayerDB);
                    this._room?.Send(EVENT_MESSAGE.PlayerDB, playerDB);
                }
            }

            this.prevWonderState = this._animator.GetInteger(Anim.WonderState);

            if (state == CharacterState.Idle)             //Send 10 more frames even if stopped
                pastIdleCount++;
            else
                pastIdleCount = 0;
            
            yield new WaitForSeconds(tick);
        }
    }
    
    private onWonderStateChange() {
        if (this._animator) return this.prevWonderState !== this._animator.GetInteger(Anim.WonderState);
        else return false;
    }
}
