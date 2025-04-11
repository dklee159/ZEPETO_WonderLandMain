import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Quaternion, Transform, Vector3 } from 'UnityEngine';

export default class TargetFollower extends ZepetoScriptBehaviour {

    @SerializeField() private target : Transform;
    @SerializeField() private followOn : boolean;
    @SerializeField() private teleportDistance : number = 10;
    @SerializeField() private alpha : number = 0.1;
    
    FixedUpdate() {
        if(this.followOn && this.target) {
            const distance = Vector3.Distance(this.transform.position, this.target.transform.position);

            if(distance < this.teleportDistance) {
                this.transform.position = Vector3.Lerp(this.transform.position, this.target.transform.position, this.alpha);
                this.transform.rotation = Quaternion.Lerp(this.transform.rotation, this.target.transform.rotation, this.alpha);
            }
            else {
                this.transform.position = this.target.transform.position;
                this.transform.rotation = this.target.transform.rotation;
            }
        }
    }

    public SetTarget(target : Transform) {
        this.target = target;
    }

    public FollowOn() {
        this.followOn = true;
        this.transform.position = this.target.transform.position;
        this.transform.rotation = this.target.transform.rotation;
        this.gameObject.SetActive(true);
    }

    public FollowOff() {
        this.followOn = false;
        this.gameObject.SetActive(false);
    }
}