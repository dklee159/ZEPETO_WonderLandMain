import { TextMeshProUGUI } from 'TMPro';
import { GameObject, Mathf, Transform } from 'UnityEngine'
import { Button } from 'UnityEngine.UI';
import { SpawnInfo, ZepetoCharacter, ZepetoCharacterCreator } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import LocalizationController from '../../ZepetoScripts/Localize/LocalizationController';
import DataManager from '../Manager/DataManager';

export default class NpcController extends ZepetoScriptBehaviour {

    @SerializeField() private spawnPos: Transform;
    @SerializeField() private zepetoId: string;
    @SerializeField() private dialogueUI: GameObject;
    @SerializeField() private dialogueText: TextMeshProUGUI;
    @SerializeField() private nextDialogueButton: Button;
    @SerializeField() private closeDialogueButton: Button;
    @SerializeField() private indexList: number[] = [];

    private _npc: ZepetoCharacter;
    private localizationController: LocalizationController;
    private pageNum: number = 0;

    private Start() {    
        this.localizationController = this.dialogueText.GetComponent<LocalizationController>();

        this.StartCoroutine(this.SpawnNpc());
        
        // ZepetoCharacterCreator.CreateByZepetoId(this.zepetoId, spawnInfo, (character: ZepetoCharacter) => {
        //     character.tag = "NPC";
        //     this._npc = character;
        // });

        this.nextDialogueButton.onClick.AddListener(() => {
            this.pageNum = Mathf.Clamp(this.pageNum + 1, 0, this.indexList.length - 1);
            this.localizationController.TranslateText(this.indexList[this.pageNum]);

            if (this.pageNum === this.indexList.length - 1) this.nextDialogueButton.gameObject.SetActive(false);
        })

        this.closeDialogueButton.onClick.AddListener(() => {
            this.dialogueUI.SetActive(false);
            this.pageNum = 0;
            this.dialogueText.text = ""
            if (!this.nextDialogueButton.gameObject.activeSelf) this.nextDialogueButton.gameObject.SetActive(true);
        })

    }

    private *SpawnNpc() {
        while (true) {
            yield null;
            if (DataManager.Instance?.IsGetPlayerDB) break;
        }

        if (DataManager.Instance.PlayerDB.isHSManager == true) return;

        const spawnInfo = new SpawnInfo();
        spawnInfo.position = this.spawnPos.position;
        spawnInfo.rotation = this.spawnPos.rotation;

        ZepetoCharacterCreator.CreateByUserId(this.zepetoId, spawnInfo, (character: ZepetoCharacter) => {
            character.tag = "NPC";
            this._npc = character;
        });
    }

    public OpenDialogue() {
        this.dialogueUI.SetActive(true);
        this.localizationController.TranslateText(this.indexList[this.pageNum]);
    }

}