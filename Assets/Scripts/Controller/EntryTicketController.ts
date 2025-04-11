import { GameObject, Animator, Vector3 } from 'UnityEngine';
import { Button, Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class EntryTicketController extends ZepetoScriptBehaviour {
    @SerializeField() private entryTicketPanel: GameObject;
    @SerializeField() private anim: Animator;
    @SerializeField() private entryTicketText: Text;
    @SerializeField() private closeBtn: Button;

    Start() {    
        this.closeBtn.onClick.AddListener(() => {
            this.entryTicketPanel.SetActive(false);
        });
    }
    
    public GetEntryTicket(amount: number) {
        this.anim.transform.localScale = Vector3.zero;
        this.entryTicketPanel.SetActive(true);
        this.anim.SetTrigger("Active");

        this.entryTicketText.text = `${amount}회 응모 완료되었습니다`;
    }
}