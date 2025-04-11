import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { AnimationClip, Coroutine, GameObject, HumanBodyBones } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { RoomData } from 'ZEPETO.Multiplay';
import DataManager from '../Manager/DataManager';
import EquipManager from '../Manager/EquipManager';
import GameManager from '../GameManager';
import { Anim, EVENT_MESSAGE, WonderState } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import MultiplayManager from '../../ZepetoScripts/Multiplay/MultiplayManager';

export default class CustomPoseController extends ZepetoScriptBehaviour {

    @SerializeField() private poseButton1: Button;
    @SerializeField() private poseButton2: Button;
    @SerializeField() private poseButton3: Button;
    @SerializeField() private awardPoseButton1: Button;
    @SerializeField() private awardPoseButton2: Button;
    @SerializeField() private awardPoseButton3: Button;

    @SerializeField() private awardPoseLockPanel: GameObject;   
    @SerializeField() private poseAnimations: AnimationClip[] = []; 

    private poseCoroutine: Coroutine;
    private _localCharacter: ZepetoCharacter;

    public RemoteStart() {    
        this.poseButton1.onClick.AddListener(() => {
            this.CustomPosePressed(this.poseAnimations[Pose_Anim.Panel_Pose_1]);
            // this.PoseButtonPushed(WonderState.Panel_Pose_1);
        });

        this.poseButton2.onClick.AddListener(() => {
            this.CustomPosePressed(this.poseAnimations[Pose_Anim.Panel_Pose_2]);
            // this.PoseButtonPushed(WonderState.Panel_Pose_2);
        });

        this.poseButton3.onClick.AddListener(() => {
            this.CustomPosePressed(this.poseAnimations[Pose_Anim.Panel_Pose_3]);
            // this.PoseButtonPushed(WonderState.Panel_Pose_3);
        });

        this.awardPoseButton1.onClick.AddListener(() => {
            this.CustomPosePressed(this.poseAnimations[Pose_Anim.Panel_LOCK_Pose_1]);
            // this.PoseButtonPushed(WonderState.Panel_LOCK_Pose_1);
        });

        this.awardPoseButton2.onClick.AddListener(() => {
            this.CustomPosePressed(this.poseAnimations[Pose_Anim.Panel_LOCK_Pose_2]);
            // this.PoseButtonPushed(WonderState.Panel_LOCK_Pose_2);
        });

        this.awardPoseButton3.onClick.AddListener(() => {
            this.CustomPosePressed(this.poseAnimations[Pose_Anim.Panel_LOCK_Pose_3]);
            // this.PoseButtonPushed(WonderState.Panel_LOCK_Pose_3);
        });

        this._localCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
    }

    private CustomPosePressed(anim: AnimationClip) {
        this._localCharacter.SetGesture(anim);
        this.StartCoroutine(this.WaitForExit());
    }

    private *WaitForExit()
    {
        if (this._localCharacter) {
            while (true) {
                if (this._localCharacter.tryJump || this._localCharacter.tryMove) {        
                    this._localCharacter.CancelGesture();                    
                    break;
                } 
                yield;
            }
        }
    }



    private PoseButtonPushed(wonderState: WonderState) {
        DataManager.Instance.SetWonderState(wonderState, true)        
        this.StopCoroutine(this.OnMoveChecker_Pose());
        if (this.poseCoroutine) this.StopCoroutine(this.poseCoroutine);
        this.poseCoroutine = this.StartCoroutine(this.OnMoveChecker_Pose());

        // Sing Mic Unequip
        // if (EquipManager.Instance.micEquip) {
        //     const data = new RoomData();
        //     data.Add(EVENT_MESSAGE.Name, EquipManager.Instance.MicName);
        //     data.Add(EVENT_MESSAGE.Attach, HumanBodyBones.RightHand);
        //     GameManager.Instance.ReceiveEquipSignal(data, false);
        // }

        // // Sing Mic Equip
        // if (wonderState == WonderState.Panel_LOCK_Pose_1) {
        //     const data = new RoomData();
        //     data.Add(EVENT_MESSAGE.Name, EquipManager.Instance.MicName);
        //     data.Add(EVENT_MESSAGE.Attach, HumanBodyBones.RightHand);
        //     MultiplayManager.instance.room.Send(EVENT_MESSAGE.Equip, data.GetObject());
        // }
    }

    /* Player Move Check Pose */
    private *OnMoveChecker_Pose() {
        const character = ZepetoPlayers.instance.GetPlayer(MultiplayManager.instance.room.SessionId).character;
        const animator = character.ZepetoAnimator;
        while (true) {
            if (character.tryJump || character.tryMove) break;
            yield null;
        }
        const wonderState = animator.GetInteger(Anim.WonderState);
        DataManager.Instance.SetWonderState(wonderState, false);

        // Sing Mic Unequip
        // if (wonderState == WonderState.Panel_LOCK_Pose_1 || EquipManager.Instance.micEquip) {
        //     const data = new RoomData();
        //     data.Add(EVENT_MESSAGE.Name, EquipManager.Instance.MicName);
        //     data.Add(EVENT_MESSAGE.Attach, HumanBodyBones.RightHand);
        //     GameManager.Instance.ReceiveEquipSignal(data, false);
        // }
    }

    public UpdateAwardPose(isClear: boolean) {
        if (isClear) this.awardPoseLockPanel.SetActive(false);
    }
}

enum Pose_Anim {
    Panel_Pose_1,
    Panel_Pose_2,
    Panel_Pose_3,
    Panel_LOCK_Pose_1,
    Panel_LOCK_Pose_2,
    Panel_LOCK_Pose_3
}