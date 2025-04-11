import { AnimationClip, Animator, GameObject, HumanBodyBones, Physics, Transform, Vector3, WaitForEndOfFrame } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import InteractionBtn from './InteractionBtn';
import CameraController from '../Controller/CameraController';

export default class InteractionController extends ZepetoScriptBehaviour {

    @SerializeField() private animationClip: AnimationClip;
    @SerializeField() private isSnapBone: boolean = true;
    @SerializeField() private bodyBone: HumanBodyBones;
    @SerializeField() private allowOverlap: boolean = false;
    @SerializeField() private transPos: Transform;
    @SerializeField() private _cameraController: GameObject;
    private cameraController: CameraController;

    private _playerGesturePosition : Vector3;
    private _localCharacter: ZepetoCharacter;
    private _interactionBtn: InteractionBtn;

    public RemoteStart() {
        this._interactionBtn = this.GetComponent<InteractionBtn>();      
        this._localCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        if (this._cameraController) this.cameraController = this._cameraController.GetComponent<CameraController>();
    }

    public SendSignal() {
        if (this.isSnapBone) {        
            //is place empty
            if (this.allowOverlap || this.FindOtherPlayerNum() < 1) {    
                //자리가 비어있음            
                this._localCharacter.SetGesture(this.animationClip);                
                this.StartCoroutine(this.SnapBone());
                this.StartCoroutine(this.WaitForExit());
                if (this.cameraController) {
                    this.cameraController.SetHallCam();
                }
            } else {
                this._interactionBtn.HideIcon();
            }
        }
        else{
            this._localCharacter.SetGesture(this.animationClip);
            this.StartCoroutine(this.WaitForExit());
        }
    }

    // The exact method must go through the server code, but it is calculated by the local client for server optimization.
    private FindOtherPlayerNum(){
        const hitInfos = Physics.OverlapSphere(this.transPos.position, 0.1);
        
        let playerNum = 0;
        if (hitInfos.length > 0){
            hitInfos.forEach((hitInfo)=>{
                if(hitInfo.transform.GetComponent<ZepetoCharacter>()){
                    playerNum ++;
                }
            });
        }
        return playerNum;
    }
    
    private *SnapBone(){
        const animator: Animator = this._localCharacter.ZepetoAnimator;
        const bone: Transform = animator.GetBoneTransform(this.bodyBone);
        
        let idx = 0;
        while (true) {
            const distance = Vector3.op_Subtraction(bone.position, this._localCharacter.transform.position);
            const newPos: Vector3 = Vector3.op_Subtraction(this.transPos.position, distance);
            
            this._playerGesturePosition = newPos;
            this._localCharacter.transform.position = this._playerGesturePosition;
            this._localCharacter.transform.rotation = this.transPos.rotation;
            yield new WaitForEndOfFrame();
            idx ++;
            // Calibrate position during 5 frames of animation.
            if (idx > 5)
                return;
        }
    }

    private *WaitForExit()
    {
        if (this._localCharacter) {
            while (true) {
                if (this._localCharacter.tryJump || this._localCharacter.tryMove)
                {        
                    this._localCharacter.CancelGesture();
                    this._interactionBtn.ShowIcon();
                    break;
                }
                else if(this.isSnapBone && this._playerGesturePosition != this._localCharacter.transform.position){
                    this._interactionBtn.ShowIcon();
                    break;
                }
                yield;
            }
        }
    }

}