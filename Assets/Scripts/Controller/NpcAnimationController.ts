import { Animator, Mathf, Random, WaitForSeconds } from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class NpcAnimationController extends ZepetoScriptBehaviour {

    public animList: string[] = [];
    public exitTimes: number[] = [];
    private npcAnimator: Animator;

    Start() {    
        this.npcAnimator = this.GetComponent<Animator>();
        this.StartCoroutine(this.PlayRandomAnimations());
    }

    private *PlayRandomAnimations(){
        const wait = new WaitForSeconds(3);
        while (true) {
            let randomIndex = Mathf.Floor(Random.Range(0, this.animList.length));            
            this.npcAnimator.Play(this.animList[randomIndex]);

            while (this.npcAnimator.GetCurrentAnimatorStateInfo(0).normalizedTime < 1 || this.npcAnimator.IsInTransition(0)) {
                yield null;
            }
            yield wait;
        }
    }

}