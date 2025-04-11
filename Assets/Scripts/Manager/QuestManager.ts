import { GameObject, Transform, Sprite } from 'UnityEngine';
import { Button, Text, Image } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { WorldService } from 'ZEPETO.World';
import { PlayerDB, QuestInfo, QuestInfo_VisitCount, QuestMenu, WorldId } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import DataManager from './DataManager';


export default class QuestManager extends ZepetoScriptBehaviour {
    /* Singleton */
    private static _instance: QuestManager;
    public static get Instance(): QuestManager {
        if (!QuestManager._instance) {
            const managerObj = GameObject.Find("QuestManager");
            if (managerObj) QuestManager._instance = managerObj.GetComponent<QuestManager>();
        }
        return QuestManager._instance;
    }

    @Header("UI")
    @SerializeField() questUI : GameObject;
    @SerializeField() dailyQuestMenu : GameObject;
    @SerializeField() weeklyQuestMenu : GameObject;
    @SerializeField() monthlyQuestMenu : GameObject;

    @SerializeField() questBtn : Button;
    @SerializeField() closeBtn : Button;
    @SerializeField() dailyBtn : Button;
    @SerializeField() weeklyBtn : Button;
    @SerializeField() monthlyBtn : Button;

    @Header("Source")
    @SerializeField() selectedSprite : Sprite;
    @SerializeField() deselectedSprite : Sprite;

    private currentMenu : QuestMenu = QuestMenu.Daily;
    private questMapping : Map<QuestMenu, QuestInfos[]> = new Map<QuestMenu, QuestInfos[]>();
    private lastDate : string;
    private today : string;

    Awake() {
        QuestManager._instance = this;
    }

    Start() {
        this.dailyBtn.onClick.AddListener(() => {
            this.OnClickMenu(QuestMenu.Daily);
        });

        this.weeklyBtn.onClick.AddListener(() => {
            this.OnClickMenu(QuestMenu.Weekly);
        });

        this.monthlyBtn.onClick.AddListener(() => {
            this.OnClickMenu(QuestMenu.Monthly);
        });

        this.questBtn.onClick.AddListener(() => {
            this.questUI.SetActive(true);
        });

        this.closeBtn.onClick.AddListener(() => {
            this.questUI.SetActive(false);
        });
    }
    
    private FormatDate(date: Date) {
        return `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;
    }

    private GetWeek(year : number, month : number, day : number) : number {
        const now = new Date(year, month - 1, day);

        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const startDayOfWeek = startOfYear.getDay();
        const firstMonday = startDayOfWeek <= 1 ? startOfYear : new Date(startOfYear.setDate(startOfYear.getDate() + (8 - startDayOfWeek)));

        // 현재 날짜와 첫 번째 월요일 간의 차이 계산
        const pastDaysOfYear = (now.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24);
        
        // 몇 주가 경과했는지 계산 (1주일은 7일)
        const currentWeek = Math.ceil((pastDaysOfYear + firstMonday.getDay()) / 7);
        return currentWeek;
    }

    public InitData(playerDB : PlayerDB, debugDate? : string) {
        this.lastDate = playerDB.attend.lastDate;
        const date = new Date();
        this.today = this.FormatDate(date);

        // 디버깅용 날짜 임의 세팅 //
        if (debugDate) this.today = debugDate;
        
        const lastSplit = this.lastDate.split("_");
        const lastYear = +lastSplit[2];
        const lastMonth = +lastSplit[1];
        const lastDay = +lastSplit[0];
        const lastWeek = this.GetWeek(lastYear, lastMonth, lastDay);
        
        const todaySplit = this.today.split("_");
        const todayYear = +todaySplit[2];
        const todayMonth = +todaySplit[1];
        const todayDay = +todaySplit[0];
        const todayWeek = this.GetWeek(todayYear, todayMonth, todayDay);

        const isDailyInit : boolean = !(lastYear == todayYear && lastMonth == todayMonth && lastDay == todayDay);
        const isWeeklyInit : boolean = !(lastYear == todayYear && lastWeek == todayWeek);
        const isMonthlyInit : boolean = !(lastYear == todayYear && lastMonth == todayMonth);

        console.log(`${lastYear},${lastMonth},${lastDay},${lastWeek},${todayYear},${todayMonth},${todayDay},${todayWeek}`)
        console.log(`${isDailyInit}, ${isWeeklyInit}, ${isMonthlyInit}`);

        const daily = playerDB.dailyQuest;
        const weekly = playerDB.weeklyQuest;
        const monthly = playerDB.monthlyQuest;
        
        const dailyArr = [daily.Visit_wonderland, daily.Visit_stage, daily.Visit_studio, daily.PlayGame_wonderland, daily.PlayGame_stage, daily.PlayGame_studio, daily.PostFeed_1];
        const weeklyArr = [weekly.Visit_world_3, weekly.HangangRace_777, weekly.DailyQuest_3, weekly.Visit_continuous_3, weekly.Visit_continuous_5, weekly.PlayGame_10, weekly.PostFeed_3]
        const monthlyArr = [monthly.Visit_world_ten, monthly.Move_wonderAwards, monthly.Visit_continous_7, monthly.WeeklyQuest_2, monthly.GatherCoin_5000, monthly.PlayGame_30, monthly.PostFeed_10]

        let dailyInfoArr : QuestInfos[] = [];
        let weeklyInfoArr : QuestInfos[] = [];
        let monthlyInfoArr : QuestInfos[] = [];

        dailyArr.forEach((info : QuestInfo, index : number) => {
            if (isDailyInit) {
                info.QuestAmount = 0;
                info.IsSuccess = false;
            }
            dailyInfoArr[info.Index] = { Info : info, UI : this.dailyQuestMenu.transform.GetChild(index) };
        });
        
        weeklyArr.forEach((info : QuestInfo, index : number) => {
            if (isWeeklyInit) {
                if (info.Index == 0) {
                    const initInfo = info as QuestInfo_VisitCount;
                    initInfo.Visit_Wonder = 0;
                    initInfo.Visit_Stage = 0;
                    initInfo.Visit_Studio = 0;
                    info = initInfo;
                }
                info.QuestAmount = 0;
                info.IsSuccess = false;
            }
            weeklyInfoArr[info.Index] = { Info : info, UI : this.weeklyQuestMenu.transform.GetChild(index) };
        });
        
        monthlyArr.forEach((info : QuestInfo, index : number) => {
            if (isMonthlyInit) {
                if (info.Index == 0) {
                    const initInfo = info as QuestInfo_VisitCount;
                    initInfo.Visit_Wonder = 0;
                    initInfo.Visit_Stage = 0;
                    initInfo.Visit_Studio = 0;
                    info = initInfo;
                }
                info.QuestAmount = 0;
                info.IsSuccess = false;
            }
            monthlyInfoArr[info.Index] = { Info : info, UI : this.monthlyQuestMenu.transform.GetChild(index) };
        });

        this.questMapping.set(QuestMenu.Daily, dailyInfoArr);
        this.questMapping.set(QuestMenu.Weekly, weeklyInfoArr);
        this.questMapping.set(QuestMenu.Monthly, monthlyInfoArr);

        dailyArr.forEach((info : QuestInfo, index : number) => {
            this.UpdateData(QuestMenu.Daily, info.Index, info.QuestAmount, true);
            this.dailyQuestMenu.transform.GetChild(info.Index).GetChild(1).GetChild(0).GetComponent<Text>().text = `+${info.CoinAmount}`;
        });

        weeklyArr.forEach((info : QuestInfo, index : number) => {
            this.UpdateData(QuestMenu.Weekly, info.Index, info.QuestAmount, true);
            this.weeklyQuestMenu.transform.GetChild(info.Index).GetChild(1).GetChild(0).GetComponent<Text>().text = `+${info.CoinAmount}`;
        });

        monthlyArr.forEach((info : QuestInfo, index : number) => {
            this.UpdateData(QuestMenu.Monthly, info.Index, info.QuestAmount, true);
            this.monthlyQuestMenu.transform.GetChild(info.Index).GetChild(1).GetChild(0).GetComponent<Text>().text = `+${info.CoinAmount}`;
        });

        console.log(`last date : ${this.lastDate}`);
        this.OnVisitWorld();
    }

    public GetData(questMenu : QuestMenu, index : number) {
        return this.questMapping.get(questMenu)[index];
    }

    public UpdateData(questMenu : QuestMenu, index : number, value : number, isInit : boolean = false) {
        const data = this.GetData(questMenu, index);
        const info = data.Info;
        const ui = data.UI;

        // 이미 성공했다면 값 추가하지 않음
        if (info.IsSuccess && !isInit) return;

        if (info.QuestAcceptAmount <= value && !info.IsSuccess && !isInit) {
            // 퀘스트 성공, 코인 획득
            info.IsSuccess = true;
            DataManager.Instance.AddCoin(info.CoinAmount, true);
            info.QuestAmount = info.QuestAcceptAmount;
        }
        else {
            info.QuestAmount = value;
        }
        DataManager.Instance.PlayerDB[questMenu][info.Name]["QuestAmount"] = info.QuestAmount;
        this.UpdateUI(ui, info.QuestAmount, info.QuestAcceptAmount, info.IsSuccess);

        // 주간퀘스트에 모든 일일 퀘스트 완료 했는지 체크
        if (questMenu == QuestMenu.Daily) {
            for (const questInfo of this.questMapping.get(QuestMenu.Daily)) {
                if (!questInfo.Info.IsSuccess) return;
            }
            this.AddData(QuestMenu.Weekly, 2, 1);
        }
        // 월간 퀘스트에 모든 주간 퀘스트 완료 했는지 체크
        else if (questMenu == QuestMenu.Weekly) {
            for (const questInfo of this.questMapping.get(QuestMenu.Weekly)) {
                if (!questInfo.Info.IsSuccess) return;
            }
            this.AddData(QuestMenu.Monthly, 3, 1);
        }
    }

    public AddData(questMenu : QuestMenu, index : number, value : number) {
        const data = this.GetData(questMenu, index);
        const info = data.Info;
        const oldValue = info.QuestAmount;
        const updateValue = oldValue + value;

        if (!info.IsSuccess) this.UpdateData(questMenu, index, updateValue);
    }

    public UpdateUI(ui : Transform, value : number, acceptValue : number, isSuccess : boolean) {
        ui.GetChild(0).GetChild(1).GetComponent<Text>().text = value.toString();
        const success = ui.GetChild(1).GetChild(1);
        success.gameObject.SetActive(isSuccess);
    }

    private OnClickMenu(questMenu : QuestMenu) {
        if(this.currentMenu == questMenu) return;
        this.currentMenu = questMenu;

        switch(questMenu) {
            case QuestMenu.Daily:
                this.dailyQuestMenu.transform.parent.parent.gameObject.SetActive(true);
                this.weeklyQuestMenu.transform.parent.parent.gameObject.SetActive(false);
                this.monthlyQuestMenu.transform.parent.parent.gameObject.SetActive(false);
                this.dailyBtn.GetComponent<Image>().sprite = this.selectedSprite;
                this.weeklyBtn.GetComponent<Image>().sprite = this.deselectedSprite;
                this.monthlyBtn.GetComponent<Image>().sprite = this.deselectedSprite;
                break;
            case QuestMenu.Weekly:
                this.dailyQuestMenu.transform.parent.parent.gameObject.SetActive(false);
                this.weeklyQuestMenu.transform.parent.parent.gameObject.SetActive(true);
                this.monthlyQuestMenu.transform.parent.parent.gameObject.SetActive(false);
                this.dailyBtn.GetComponent<Image>().sprite = this.deselectedSprite;
                this.weeklyBtn.GetComponent<Image>().sprite = this.selectedSprite;
                this.monthlyBtn.GetComponent<Image>().sprite = this.deselectedSprite;
                break;
            case QuestMenu.Monthly:
                this.dailyQuestMenu.transform.parent.parent.gameObject.SetActive(false);
                this.weeklyQuestMenu.transform.parent.parent.gameObject.SetActive(false);
                this.monthlyQuestMenu.transform.parent.parent.gameObject.SetActive(true);
                this.dailyBtn.GetComponent<Image>().sprite = this.deselectedSprite;
                this.weeklyBtn.GetComponent<Image>().sprite = this.deselectedSprite;
                this.monthlyBtn.GetComponent<Image>().sprite = this.selectedSprite;
                break;
            default:
                break;
        }
    }

    /* 퀘스트 시그널 함수 */
    // 월드 입장 시
    public OnVisitWorld(worldId? : string) {
        const visit_weekly = this.GetData(QuestMenu.Weekly, 0).Info as QuestInfo_VisitCount;
        const wonder_month = this.GetData(QuestMenu.Monthly, 0).Info as QuestInfo_VisitCount;
        let id = WorldService.worldId
        // 디버깅용
        if (worldId) id = worldId;

        console.log(id);

        switch(id) {
            case WorldId.WorldId_Land:
                visit_weekly.Visit_Wonder++;
                wonder_month.Visit_Wonder++;
                if (visit_weekly.Visit_Wonder == visit_weekly.Visit_Count) this.AddData(QuestMenu.Weekly, 0, 1);
                if (wonder_month.Visit_Wonder == wonder_month.Visit_Count) this.AddData(QuestMenu.Monthly, 0, 1);
                this.UpdateData(QuestMenu.Daily, 0, 1);
                break;
            case WorldId.WorldId_Stage:
                visit_weekly.Visit_Stage++;
                wonder_month.Visit_Stage++;
                if (visit_weekly.Visit_Stage == visit_weekly.Visit_Count) this.AddData(QuestMenu.Weekly, 0, 1);
                if (wonder_month.Visit_Stage == wonder_month.Visit_Count) this.AddData(QuestMenu.Monthly, 0, 1);
                this.UpdateData(QuestMenu.Daily, 1, 1);
                break;
            case WorldId.WorldId_Studio:
                visit_weekly.Visit_Studio++;
                wonder_month.Visit_Studio++;
                if (visit_weekly.Visit_Studio == visit_weekly.Visit_Count) this.AddData(QuestMenu.Weekly, 0, 1);
                if (wonder_month.Visit_Studio == wonder_month.Visit_Count) this.AddData(QuestMenu.Monthly, 0, 1);
                this.UpdateData(QuestMenu.Daily, 2, 1);
                break;
            default:
                break;
        }

        const todaySplit = this.today.split("_");
        const lastSplit = this.lastDate.split("_");
        const todayDay = +todaySplit[0];
        const todayMonth = +todaySplit[1];
        const todayYear = +todaySplit[2];
        const lastDay = +lastSplit[0];
        const lastMonth = +lastSplit[1];
        const lastYear = +lastSplit[2];
        
        const diff = new Date(todayYear, todayMonth, todayDay).getTime() - new Date(lastYear, lastMonth, lastDay).getTime();
        const diffNum = diff / (1000 * 60 * 60 * 24);

        if (diffNum == 1){
            this.AddData(QuestMenu.Weekly, 3, 1);
            this.AddData(QuestMenu.Weekly, 4, 1);
            this.AddData(QuestMenu.Monthly, 2, 1);
        }
        else {
            this.UpdateData(QuestMenu.Weekly, 3, 1);
            this.UpdateData(QuestMenu.Weekly, 4, 1);
            this.UpdateData(QuestMenu.Monthly, 2, 1);
        }
    }

    // 게임플레이
    public OnPlayGame(hangangValue? : number) {
        switch(WorldService.worldId) {
            case WorldId.WorldId_Land:
                this.UpdateData(QuestMenu.Daily, 3, 1);
                break;
            case WorldId.WorldId_Stage:
                this.UpdateData(QuestMenu.Daily, 4, 1);
                break;
            case WorldId.WorldId_Studio:
                this.UpdateData(QuestMenu.Daily, 5, 1);
                break;
            default:
                break;
        }

        this.AddData(QuestMenu.Weekly, 5, 1);
        this.AddData(QuestMenu.Monthly, 5, 1);
        if(hangangValue) {
            const old = this.GetData(QuestMenu.Weekly, 1).Info.QuestAmount;
            if (old < hangangValue) this.UpdateData(QuestMenu.Weekly, 1, hangangValue);
        }
    }

    // 게시물 게시
    public OnPostFeed() {
        this.AddData(QuestMenu.Daily, 6, 1);
        this.AddData(QuestMenu.Weekly, 6, 1);
        this.AddData(QuestMenu.Monthly, 6, 1);
    }

    // 코인 얻을시
    public OnGetCoin(amount : number) {
        this.AddData(QuestMenu.Monthly, 4, amount);
    }

    // 언더어워즈 월드 시상식장 이동
    public OnWonderAwards() {
        this.UpdateData(QuestMenu.Monthly, 1, 1);
    }
}

interface QuestInfos {
    Info : QuestInfo,
    UI : Transform
}
