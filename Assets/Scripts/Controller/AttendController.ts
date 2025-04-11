import { TextMeshProUGUI } from 'TMPro';
import { Animator, GameObject, Mathf, Transform, WaitForSeconds } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import DataManager from '../Manager/DataManager';
import { Anim, Attend, DATA_TYPE, ERROR } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import GameManager from '../GameManager';

export default class AttendController extends ZepetoScriptBehaviour {

    /* Properties */
    @SerializeField() private attendUI: GameObject;//
    @SerializeField() private attendButton: Button;
    @SerializeField() private attendCloseButton: Button;
    @SerializeField() private attendContent: Transform;
    @SerializeField() private coinRewardUI: Transform;

    @Header("RewardUI Buttons")
    @SerializeField() private yButton_coin: Button;
    @SerializeField() private nButton_coin: Button;

    private attendPanels: AttendPanel[] = [];
    private coinText: TextMeshProUGUI;
    private _dateIndex: number = -1;
    public get dateIndex(): number { return this._dateIndex; }
    public set dateIndex(value: number) {
        if(!this.attendPanels || this.attendPanels.length < 20 || value < 0 || value > this.attendPanels.length) {
            console.error(ERROR.NOT_MATCHED, value);
        } else {
            this._dateIndex = value;
        }
    }
    private readonly coinList = [ 5, 50, 100, 200, 500 ];
    private attending: boolean = false;
    
    private _month: string;
    public get month(): string { return this._month; }
    private set month(value: string) { this._month = value; }

    private _dateId: string;
    public get dateId(): string { return this._dateId; }
    private set dateId(value: string) { this._dateId = value; }
    
    @SerializeField() exceptIds : string[] = [];

    // private _yesterDateId: string;
    // public get yesterDateId(): string { return this._yesterDateId; }
    // private set yesterDateId(value: string) { this._yesterDateId = value; }

    /* GameManager */
    public RemoteStart() {
        /* Init Id */
        const today = new Date();
        // const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() -1);

        this.month = `${today.getMonth() +1}`;
        this.dateId = this.FormatDate(today);
        // this.yesterDateId = this.FormatDate(yesterday);

        // attend 버튼 퀘스트로 교체
        // this.attendButton.onClick.AddListener(() => {
        //     this.attendUI.SetActive(!this.attendUI.activeSelf);
        //     if (!this.attendUI.activeSelf) {
        //         if (this.coinRewardUI.gameObject.activeSelf) this.coinRewardUI.gameObject.SetActive(false);
        //     }
        // })

        this.attendCloseButton.onClick.AddListener(() => {
            this.attendUI.SetActive(false);
        });

        this.yButton_coin.onClick.AddListener(() => {
            this.coinRewardUI.gameObject.SetActive(false);            
        });

        this.nButton_coin.onClick.AddListener(() => {
            this.coinRewardUI.gameObject.SetActive(false);            
        });

        /* Set Init */
        this.SetAttendUI();
    }

    private SetAttendUI() {
        // Attend   
        for (let i = 0; i < this.attendContent.childCount; i++) {
            const attendPanel = this.attendContent.GetChild(i);
            const highlight = attendPanel.GetChild(0);
            const lock = attendPanel.GetChild(1);

            attendPanel.gameObject.SetActive(false);

            const data:AttendPanel = {
                gameObject: attendPanel.gameObject,
                transform: attendPanel,
                highlight: highlight.gameObject,
                lock: lock.gameObject,
                index: i,
            };
            this.attendPanels.push(data);
        }

        this.coinText = this.coinRewardUI.GetChild(3).GetComponent<TextMeshProUGUI>();
    }

    public UpdateAttendData(attendData: Attend) {
        /* new version */
        const isFirst = attendData.lastDate == null || attendData.lastDate == DATA_TYPE.NULL || attendData.lastDate.length < 1;
        if (isFirst) {
            attendData.lastDate = `0_0_0`;
            attendData.count = 0;
        }

        // Attend Check Last Month
        const date = attendData.lastDate.split("_");
        if (this.month != date[1]) {
            attendData.count = 0;
        }

        // Lock
        for(let i=0; i < attendData.count; i++) this.LockCoin(i);
        this.dateIndex = attendData.count;

        // This Month complete
        const complete = attendData.count >= 20;
        if (complete) return;

        // Attend Already Today
        if (this.dateId == attendData.lastDate) return;

        // Set Date
        const today = this.attendPanels[attendData.count];
        today.gameObject.SetActive(true);
        today.highlight.SetActive(true);
        today.lock.SetActive(false);

        const coin = this.coinList[this.SelectCoin(attendData.count)];
        this.coinText.text = this.FormatText(coin);

        this.OnGetCoin(this.dateIndex);

        this.StartCoroutine(this.AttendChecker());
    }

    /* Animation */
    private *AttendChecker() {
        const wait = new WaitForSeconds(1);
        this.attending = true;

        if(this.exceptIds.includes(GameManager.Instance.zepetoId)) return;

        // UIManager.Instance.openUI = this.attendUI.gameObject;
        this.attendUI.SetActive(true);
        yield wait;

        this.coinRewardUI.gameObject.SetActive(true);
        const anim = this.coinRewardUI.GetComponent<Animator>();
        anim.SetTrigger(Anim.Active);
    }

    private LockCoin(index: number) {
        if(index < 0 || index >= this.attendPanels.length) return;

        const data = this.attendPanels[index];
        data.gameObject.SetActive(true);
        data.highlight.SetActive(false);
        data.lock.SetActive(true);
    }

    private OnGetCoin(index: number) {
        if(index < 0) return;

        // Lock
        this.LockCoin(index);

        // Update Attend Data
        const attend = DataManager.Instance.PlayerDB.attend;
        attend.count = this.NextDate(index);
        attend.lastDate = this.dateId;

        // Update Coin Data
        const coin = this.coinList[this.SelectCoin(index)];
        DataManager.Instance.PlayerDB.wonderCoin = Mathf.Clamp(DataManager.Instance.PlayerDB.wonderCoin + coin, 0, DataManager.coinLimit);
        
        // Finish
        //TODO
        // GameManager.instance.LocalPlayerControllerSet(true);
        this.attending = false;
    }

    /** Methods **/
    private SelectCoin(index:number) {
        if((index +1) % 5 == 0)
            return Mathf.Floor( (index +  1) / 5 );
        return 0;
    }
    
    private FormatText(coin:number) {
        return `COIN ${coin}`;
    }
    
    private NextDate(index:number) {
        return (index +1 < 20) ? index + 1 : 0;
    }
    
    private FormatDate(date:Date) {
        return `${date.getDate()}_${date.getMonth()+1}_${date.getFullYear()}`;
    }
}

interface AttendPanel {
    gameObject: GameObject,
    transform: Transform,
    highlight: GameObject,
    lock: GameObject,
    index: number,
}