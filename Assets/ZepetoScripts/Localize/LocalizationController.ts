import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { TextMeshPro, TextMeshProUGUI } from 'TMPro';
import { Text } from 'UnityEngine.UI';
import { ERROR } from '../SyncHelper/TypeSyncHelper';
import TranslateManager from './TranslateManager';


export default class LocalizationController extends ZepetoScriptBehaviour {

    @SerializeField() private textIndex: number = 0;

    @Header("Support - Index")
    @SerializeField() private supportHead: boolean = false;
    @SerializeField() private supportTail: boolean = false;
    @SerializeField() private headText: string;
    @SerializeField() private tailText: string;
    
    @Header("Array")
    @SerializeField() private isArray: boolean = false;
    @SerializeField() private indexs: number[] = [];
    private _textList: string[] = [];
    public get textList(): string[] { return this._textList; }
    private set textList(value: string[]) { this._textList = value; }
    public textMap : Map<number, string> = new Map<number, string>();

    private isStarted: boolean = false;

    Start() {
        this.onStart();
    }

    // public RemoteStart() {
    //     this.onStart();
    // }

    private onStart() {
        if(this.isStarted) return;
        this.isStarted = true;

        if (this.gameObject.TryGetComponent<Text>(null)) {
            this.gameObject.GetComponent<Text>().text = this.SupportText(TranslateManager.GetText(this.textIndex));
        } else if (this.gameObject.TryGetComponent<TextMeshPro>(null)) {
            this.gameObject.GetComponent<TextMeshPro>().text = this.SupportText(TranslateManager.GetText(this.textIndex));
        } else if (this.gameObject.TryGetComponent<TextMeshProUGUI>(null)) {
            this.gameObject.GetComponent<TextMeshProUGUI>().text = this.SupportText(TranslateManager.GetText(this.textIndex));
        } else {
            console.error(ERROR.TRANSLATE_NOT_FOUND);
        }

        // Array
        if(!this.isArray) return;
        for(const index of this.indexs) {
            const text = TranslateManager.GetText(index);            
            this.textMap.set(index, text);
            this.textList.push(text);
        }
    }

    private SupportText(text:string) {
        if(this.supportHead) text = this.headText.concat(text);
        if(this.supportTail) text = text.concat(this.tailText);
        return text;
    }

    public TranslateText(index: number) {
        if (this.gameObject.TryGetComponent<Text>(null)) {
            this.gameObject.GetComponent<Text>().text = this.SupportText(TranslateManager.GetText(index));
        } else if (this.gameObject.TryGetComponent<TextMeshPro>(null)) {
            this.gameObject.GetComponent<TextMeshPro>().text = this.SupportText(TranslateManager.GetText(index));
        } else if (this.gameObject.TryGetComponent<TextMeshProUGUI>(null)) {
            this.gameObject.GetComponent<TextMeshProUGUI>().text = this.SupportText(TranslateManager.GetText(index));
        } else {
            console.error(ERROR.TRANSLATE_NOT_FOUND);
        }
    }

    public GetTextInArray(index : number) {
        if(!this.isStarted) this.onStart();
        if(this.textMap.has(index)) return this.textMap.get(index);
    }
}