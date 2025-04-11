import { WorldService } from "ZEPETO.World";
import { DATA_TYPE, ERROR, EVENT_MESSAGE, PlayerDB, WonderCollection, WonderCollectionList, WonderDrawList, WonderItemList, SDName } from '../ZepetoScripts/SyncHelper/TypeSyncHelper';
import GameManager from "./GameManager";

/*** Http Data Connection Service ***/
export default class HttpDataConnectionService {

    /* Singleton */
    private constructor() { }
    private static _instance: HttpDataConnectionService | null = null;
    public static get instance(): HttpDataConnectionService {
        if (!HttpDataConnectionService._instance) {
            HttpDataConnectionService._instance = new HttpDataConnectionService();
        }
        return HttpDataConnectionService._instance;
    }

    private SDinitVersion = "1.0.0";

    /* Create New Data */
    public get InitData(): PlayerDB {
        const playerDB:PlayerDB = {
            userId: WorldService.userId,
            zepetoId : GameManager.Instance.zepetoId,
            version: EVENT_MESSAGE.Data_Version,
            attend: { lastDate: DATA_TYPE.Empty, count:0 },
            wonderCoin: 0,
            wonderItems: [
                { id: WonderItemList.TICKET_BALLOON, count:0 },
                { id: WonderItemList.TICKET_BUMPER, count:0 },
                { id: WonderItemList.TICKET_HORROR, count:0 },
                { id: WonderItemList.TICKET_PLAY, count:0 },
            ],
            wonderCollection: [
                { id: WonderCollectionList.Wonder_Badge_Hall, has:false },
                { id: WonderCollectionList.Wonder_Badge_Stage, has:false },
                { id: WonderCollectionList.Wonder_Badge_Studio, has:false },
                { id: WonderCollectionList.Hiddle_Collection, has:false },
            ],

            dailyQuest : {
                Visit_wonderland : { Index : 0, Name : "Visit_wonderland", CoinAmount : 50, QuestAmount : 0, QuestAcceptAmount : 1, IsSuccess : false },
                Visit_stage : { Index : 1, Name : "Visit_stage", CoinAmount : 50, QuestAmount : 0, QuestAcceptAmount : 1, IsSuccess : false },
                Visit_studio : { Index : 2, Name : "Visit_studio", CoinAmount : 50, QuestAmount : 0, QuestAcceptAmount : 1, IsSuccess : false },
                PlayGame_wonderland : { Index : 3, Name : "PlayGame_wonderland", CoinAmount : 100, QuestAmount : 0, QuestAcceptAmount : 1, IsSuccess : false },
                PlayGame_stage : { Index : 4, Name : "PlayGame_stage", CoinAmount : 100, QuestAmount : 0, QuestAcceptAmount : 1, IsSuccess : false },
                PlayGame_studio : { Index : 5, Name : "PlayGame_studio", CoinAmount : 100, QuestAmount : 0, QuestAcceptAmount : 1, IsSuccess : false },
                PostFeed_1 : { Index : 6, Name : "PostFeed_1", CoinAmount : 100, QuestAmount : 0, QuestAcceptAmount : 1, IsSuccess : false }
            },

            weeklyQuest : {
                Visit_world_3 : { Index : 0, Name : "Visit_world_3", CoinAmount : 150, QuestAmount : 0, QuestAcceptAmount : 3, IsSuccess : false, Visit_Wonder : 0, Visit_Studio : 0, Visit_Stage : 0, Visit_Count : 1 },
                HangangRace_777 : { Index : 1, Name : "HangangRace_777", CoinAmount : 200, QuestAmount : 0, QuestAcceptAmount : 777, IsSuccess : false },
                DailyQuest_3 : { Index : 2, Name : "DailyQuest_3", CoinAmount : 200, QuestAmount : 0, QuestAcceptAmount : 3, IsSuccess : false },
                Visit_continuous_3 : { Index : 3, Name : "Visit_continuous_3", CoinAmount : 200, QuestAmount : 0, QuestAcceptAmount : 3, IsSuccess : false },
                Visit_continuous_5 : { Index : 4, Name : "Visit_continuous_5", CoinAmount : 400, QuestAmount : 0, QuestAcceptAmount : 5, IsSuccess : false },
                PlayGame_10 : { Index : 5, Name : "PlayGame_10", CoinAmount : 400, QuestAmount : 0, QuestAcceptAmount : 10, IsSuccess : false },
                PostFeed_3 : { Index : 6, Name : "PostFeed_3", CoinAmount : 400, QuestAmount : 0, QuestAcceptAmount : 3, IsSuccess : false }
            },

            monthlyQuest : {
                Visit_world_ten : { Index : 0, Name : "Visit_world_ten", CoinAmount : 400, QuestAmount : 0, QuestAcceptAmount : 3, IsSuccess : false, Visit_Wonder : 0, Visit_Studio : 0, Visit_Stage : 0, Visit_Count : 10 },
                Move_wonderAwards : { Index : 1, Name : "Move_wonderAwards", CoinAmount : 400, QuestAmount : 0, QuestAcceptAmount : 1, IsSuccess : false },
                Visit_continous_7 : { Index : 2, Name : "Visit_continous_7", CoinAmount : 400, QuestAmount : 0, QuestAcceptAmount : 7, IsSuccess : false },
                WeeklyQuest_2 : { Index : 3, Name : "WeeklyQuest_2", CoinAmount : 1000, QuestAmount : 0, QuestAcceptAmount : 2, IsSuccess : false },
                GatherCoin_5000 : { Index : 4, Name : "GatherCoin_5000", CoinAmount : 1000, QuestAmount : 0, QuestAcceptAmount : 500, IsSuccess : false },
                PlayGame_30 : { Index : 5, Name : "PlayGame_30", CoinAmount : 3000, QuestAmount : 0, QuestAcceptAmount : 30, IsSuccess : false },
                PostFeed_10 : { Index : 6, Name : "PostFeed_10", CoinAmount : 2000, QuestAmount : 0, QuestAcceptAmount : 10, IsSuccess : false }
            },

            wonderDraw : [
                { id : WonderDrawList.K, amount : 0 },
                { id : WonderDrawList.Won, amount : 0 },
                { id : WonderDrawList.Der, amount : 0 },
                { id : WonderDrawList.Land, amount : 0 },
            ],

            SDCharacter : [
                { Index : SDName.Siwoo, Has : false, Equip : false },
                { Index : SDName.Yubin, Has : false, Equip : false },
                { Index : SDName.Gabin, Has : false, Equip : false },
                { Index : SDName.Jia, Has : false, Equip : false },
                { Index : SDName.Hajun, Has : false, Equip : false },
            ],
            isHSManager: false,
            nextMonday: GameManager.Instance.GetNextMonday(),
            lastVisit: 0,
            totalVisit: 0,
            entryTicketAmount : 0,
            entryTicket: {
                wonderland: false,
                stage: false,
                studio: false,
                awards: false
            }
        }
        console.log(`[HttpDataConnectionService] Success New PlayerDB Created [${WorldService.userId}]`);
        return playerDB;
    }

    /* Fix and Update Data */
    public UpdateData(oldData: PlayerDB) {
        const playerDB = this.InitData;        
        
        this.CheckSDVersion(oldData);

        // wonder coin
        if(this.IsUsefulData(oldData.wonderCoin, "wonderCoin")) playerDB.wonderCoin = oldData.wonderCoin;

        // attend
        if(this.IsUsefulData(oldData.attend, "attend")) {
            if(this.IsUsefulData(oldData.attend.lastDate, "attend.lastDate") && this.IsUsefulData(oldData.attend.count, "attend.count")) {
                playerDB.attend.count = oldData.attend.count;
                playerDB.attend.lastDate = oldData.attend.lastDate;
            }
        }

        // wonder items
        if(this.IsUsefulData(oldData.wonderItems, "wonder items")) {
            for(const oldItem of oldData.wonderItems) {
                if(!this.IsUsefulData(oldItem, "wonder items[oldItem]")) continue;
                if(!this.IsUsefulData(oldItem.id, "wonder items[oldItem].id")) continue;
                if(!this.IsUsefulData(oldItem.count, "wonder items[oldItem].count")) continue;
                for(const item of playerDB.wonderItems) {
                    if(item.id == oldItem.id) item.count = oldItem.count;
                }
            }
        }

        // wonder collections
        if(this.IsUsefulData(oldData.wonderCollection, "wonder collections")) {
            for(const oldItem of oldData.wonderCollection) {
                if(!this.IsUsefulData(oldItem, "wonder collections[oldData]")) continue;
                if(!this.IsUsefulData(oldItem.id, "wonder collections[oldData].id")) continue;
                if(!this.IsUsefulData(oldItem.has, "wonder collections[oldData].has")) continue;
                for(const item of playerDB.wonderCollection) {
                    if(item.id == oldItem.id) item.has = oldItem.has;
                }
            }
        }

        if (this.IsUsefulData(oldData.wonderDraw, "wonder wonderDraw")) {
            for (const oldItem of oldData.wonderDraw) {
                if (!this.IsUsefulData(oldItem, "wonder wonderDraw[oldData]")) continue;
                if (!this.IsUsefulData(oldItem.id, "wonder wonderDraw[oldData].id")) continue;
                if (!this.IsUsefulData(oldItem.amount, "wonder wonderDraw[oldData].has")) continue;
                for (const item of playerDB.wonderDraw) {
                    if (item.id == oldItem.id) item.amount = oldItem.amount;
                }
            }
        }

        if(this.IsUsefulData(oldData.dailyQuest, "daily quest")) {
            // const daily = playerDB.dailyQuest;
            playerDB.dailyQuest.Visit_wonderland.QuestAmount = oldData.dailyQuest.Visit_wonderland.QuestAmount;
            playerDB.dailyQuest.Visit_wonderland.IsSuccess = oldData.dailyQuest.Visit_wonderland.IsSuccess;
            playerDB.dailyQuest.Visit_stage.QuestAmount = oldData.dailyQuest.Visit_stage.QuestAmount;
            playerDB.dailyQuest.Visit_stage.IsSuccess = oldData.dailyQuest.Visit_stage.IsSuccess;
            playerDB.dailyQuest.Visit_studio.QuestAmount = oldData.dailyQuest.Visit_studio.QuestAmount;
            playerDB.dailyQuest.Visit_studio.IsSuccess = oldData.dailyQuest.Visit_studio.IsSuccess;
            playerDB.dailyQuest.PlayGame_wonderland.QuestAmount = oldData.dailyQuest.PlayGame_wonderland.QuestAmount;
            playerDB.dailyQuest.PlayGame_wonderland.IsSuccess = oldData.dailyQuest.PlayGame_wonderland.IsSuccess;
            playerDB.dailyQuest.PlayGame_stage.QuestAmount = oldData.dailyQuest.PlayGame_stage.QuestAmount;
            playerDB.dailyQuest.PlayGame_stage.IsSuccess = oldData.dailyQuest.PlayGame_stage.IsSuccess;
            playerDB.dailyQuest.PlayGame_studio.QuestAmount = oldData.dailyQuest.PlayGame_studio.QuestAmount;
            playerDB.dailyQuest.PlayGame_studio.IsSuccess = oldData.dailyQuest.PlayGame_studio.IsSuccess;
            playerDB.dailyQuest.PostFeed_1.QuestAmount = oldData.dailyQuest.PostFeed_1.QuestAmount;
            playerDB.dailyQuest.PostFeed_1.IsSuccess = oldData.dailyQuest.PostFeed_1.IsSuccess;
        }

        if(this.IsUsefulData(oldData.weeklyQuest, "weekly quest")) {
            // const weekly = playerDB.weeklyQuest;
            // playerDB.weeklyQuest = oldData.weeklyQuest;
            playerDB.weeklyQuest.Visit_world_3.QuestAmount = oldData.weeklyQuest.Visit_world_3.QuestAmount;
            playerDB.weeklyQuest.Visit_world_3.IsSuccess = oldData.weeklyQuest.Visit_world_3.IsSuccess;
            playerDB.weeklyQuest.Visit_world_3.Visit_Wonder = oldData.weeklyQuest.Visit_world_3.Visit_Wonder;
            playerDB.weeklyQuest.Visit_world_3.Visit_Stage = oldData.weeklyQuest.Visit_world_3.Visit_Stage;
            playerDB.weeklyQuest.Visit_world_3.Visit_Studio = oldData.weeklyQuest.Visit_world_3.Visit_Studio;

            playerDB.weeklyQuest.HangangRace_777.QuestAmount = oldData.weeklyQuest.HangangRace_777.QuestAmount;
            playerDB.weeklyQuest.HangangRace_777.IsSuccess = oldData.weeklyQuest.HangangRace_777.IsSuccess;
            playerDB.weeklyQuest.DailyQuest_3.QuestAmount = oldData.weeklyQuest.DailyQuest_3.QuestAmount;
            playerDB.weeklyQuest.DailyQuest_3.IsSuccess = oldData.weeklyQuest.DailyQuest_3.IsSuccess;
            playerDB.weeklyQuest.Visit_continuous_3.QuestAmount = oldData.weeklyQuest.Visit_continuous_3.QuestAmount;
            playerDB.weeklyQuest.Visit_continuous_3.IsSuccess = oldData.weeklyQuest.Visit_continuous_3.IsSuccess;
            playerDB.weeklyQuest.Visit_continuous_5.QuestAmount = oldData.weeklyQuest.Visit_continuous_5.QuestAmount;
            playerDB.weeklyQuest.Visit_continuous_5.IsSuccess = oldData.weeklyQuest.Visit_continuous_5.IsSuccess;
            playerDB.weeklyQuest.PlayGame_10.QuestAmount = oldData.weeklyQuest.PlayGame_10.QuestAmount;
            playerDB.weeklyQuest.PlayGame_10.IsSuccess = oldData.weeklyQuest.PlayGame_10.IsSuccess;
            playerDB.weeklyQuest.PostFeed_3.QuestAmount = oldData.weeklyQuest.PostFeed_3.QuestAmount;
            playerDB.weeklyQuest.PostFeed_3.IsSuccess = oldData.weeklyQuest.PostFeed_3.IsSuccess;
        }

        if(this.IsUsefulData(oldData.monthlyQuest, "monthly quest")) {
            // const monthly = playerDB.monthlyQuest;
            // playerDB.monthlyQuest = oldData.monthlyQuest;

            // playerDB.monthlyQuest = oldData.monthlyQuest;
            playerDB.monthlyQuest.Visit_world_ten.QuestAmount = oldData.monthlyQuest.Visit_world_ten.QuestAmount;
            playerDB.monthlyQuest.Visit_world_ten.IsSuccess = oldData.monthlyQuest.Visit_world_ten.IsSuccess;
            playerDB.monthlyQuest.Visit_world_ten.Visit_Wonder = oldData.monthlyQuest.Visit_world_ten.Visit_Wonder;
            playerDB.monthlyQuest.Visit_world_ten.Visit_Stage = oldData.monthlyQuest.Visit_world_ten.Visit_Stage;
            playerDB.monthlyQuest.Visit_world_ten.Visit_Studio = oldData.monthlyQuest.Visit_world_ten.Visit_Studio;

            playerDB.monthlyQuest.Move_wonderAwards.QuestAmount = oldData.monthlyQuest.Move_wonderAwards.QuestAmount;
            playerDB.monthlyQuest.Move_wonderAwards.IsSuccess = oldData.monthlyQuest.Move_wonderAwards.IsSuccess;
            playerDB.monthlyQuest.Visit_continous_7.QuestAmount = oldData.monthlyQuest.Visit_continous_7.QuestAmount;
            playerDB.monthlyQuest.Visit_continous_7.IsSuccess = oldData.monthlyQuest.Visit_continous_7.IsSuccess;
            playerDB.monthlyQuest.WeeklyQuest_2.QuestAmount = oldData.monthlyQuest.WeeklyQuest_2.QuestAmount;
            playerDB.monthlyQuest.WeeklyQuest_2.IsSuccess = oldData.monthlyQuest.WeeklyQuest_2.IsSuccess;
            playerDB.monthlyQuest.GatherCoin_5000.QuestAmount = oldData.monthlyQuest.GatherCoin_5000.QuestAmount;
            playerDB.monthlyQuest.GatherCoin_5000.IsSuccess = oldData.monthlyQuest.GatherCoin_5000.IsSuccess;
            playerDB.monthlyQuest.PlayGame_30.QuestAmount = oldData.monthlyQuest.PlayGame_30.QuestAmount;
            playerDB.monthlyQuest.PlayGame_30.IsSuccess = oldData.monthlyQuest.PlayGame_30.IsSuccess;
            playerDB.monthlyQuest.PostFeed_10.QuestAmount = oldData.monthlyQuest.PostFeed_10.QuestAmount;
            playerDB.monthlyQuest.PostFeed_10.IsSuccess = oldData.monthlyQuest.PostFeed_10.IsSuccess;
        }

        if(this.IsUsefulData(oldData.SDCharacter, "sd character")) {
            playerDB.SDCharacter.forEach((value, key) => {
                if(oldData.SDCharacter[key]) {
                    value.Has = oldData.SDCharacter[key].Has;
                    if(!value.Has) value.Equip = false;
                    else value.Equip = oldData.SDCharacter[key].Equip;
                }
            });
        }

        if (this.IsUsefulData(oldData.isHSManager, "hs manager")) {
            playerDB.isHSManager = oldData.isHSManager;
        }

        if (this.IsUsefulData(oldData.nextMonday, "nextMonday")) {
            playerDB.nextMonday = oldData.nextMonday;
        }

        if (this.IsUsefulData(oldData.lastVisit, "lastVisit")) {
            playerDB.lastVisit = oldData.lastVisit;
        }

        if (this.IsUsefulData(oldData.totalVisit, "totalVisit")) {
            playerDB.totalVisit = oldData.totalVisit;
        }

        if (this.IsUsefulData(oldData.entryTicketAmount, "entryTicketAmount")) {
            playerDB.entryTicketAmount = oldData.entryTicketAmount;
        }

        if (this.IsUsefulData(oldData.entryTicket, "entryTicket")) {
            playerDB.entryTicket = oldData.entryTicket;
        }

        return playerDB;
    }

    private IsUsefulData(data: any, errorName: string) {
        if (data == undefined || data == null) {
            console.error(ERROR.NOT_MATCHED, errorName);
            return false;
        }
        return true;
    } 

    private CheckSDVersion(playerDB : PlayerDB) {
        if(this.VersionToNum(playerDB.version) < this.VersionToNum(this.SDinitVersion)) {
            playerDB.wonderCollection.forEach((wonderCollection : WonderCollection, index : number) => {
                if(wonderCollection.id !== WonderCollectionList.Hiddle_Collection) {
                    wonderCollection.has = false;
                }
            });
        }
    }

    public VersionToNum(version : string) : number{
        const split = version.split(".");
        const first = +split[0] * 100;
        const second = +split[1] * 10;
        const third = +split[2] * 1;

        return first + second + third;
    }
}