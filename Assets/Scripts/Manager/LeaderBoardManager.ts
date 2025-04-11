import { TextMeshProUGUI } from 'TMPro';
import { GameObject, Mathf, Rect, Sprite, Texture, Texture2D, Transform, Vector2 } from 'UnityEngine';
import { Button, Image } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GetRangeRankResponse, LeaderboardAPI, ResetRule, SetScoreResponse } from 'ZEPETO.Script.Leaderboard';
import { Users, ZepetoWorldHelper } from 'ZEPETO.World';
import { RoomData } from 'ZEPETO.Multiplay';
import { DATA_TYPE, EVENT_MESSAGE, RankData } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import MultiplayManager from '../../ZepetoScripts/Multiplay/MultiplayManager';

export default class LeaderBoardManager extends ZepetoScriptBehaviour {

    private static _instance: LeaderBoardManager;
    public static get Instance(): LeaderBoardManager {
        if (!LeaderBoardManager._instance) {
            const managerObj = GameObject.Find("LeaderBoardManager");
            if (managerObj) LeaderBoardManager._instance = managerObj.GetComponent<LeaderBoardManager>();
        }
        return LeaderBoardManager._instance;         
    }

    @Header("Main")
    @SerializeField() private grayProfile: Sprite;
    @SerializeField() private purpleProfile: Sprite;
    private localRankUI: RankUI[] = [];

    @SerializeField() private horror_RankPanels_World: Transform;
    @SerializeField() private horror_RankPanels_All: Transform;
    @SerializeField() private horror_RankPanels_Notice: Transform;
    // @SerializeField() private horror_RankPanels_Result: Transform;
    private horror_RankUIs_World:RankUI[] = [];
    private horror_RankUIs_All:RankUI[] = [];
    private horror_RankUIs_Notice:RankUI[] = [];
    // private horror_RankUIs_Result:RankUI[] = [];

    @SerializeField() private horror_LocalRankPanel_All: Transform;
    @SerializeField() private horror_LocalRankPanel_Notice: Transform;
    // @SerializeField() private horror_LocalRankPanel_Result: Transform;

    @SerializeField() private rankUI: GameObject;
    @SerializeField() private rankUICloseButton: Button;
    private horror_LocalRankUI_All: RankUI;
    private horror_LocalRankUI_Notice: RankUI;
    // private horror_LocalRankUI_Result: RankUI;
    private horror_LocalRankUI_Notice_RankTexts: TextMeshProUGUI[] = [];

    private _localUserId: string;

    private _nick: string;
    public get nick(): string { return this._nick; }
    public set nick(value: string) {
        if (this._nick != null && this._nick != DATA_TYPE.NULL) return;
        this._nick = value;
        for (const ui of this.localRankUI) ui.text_Id.text = this.ProcessingId(value);
        // GameManager.instance.AddPlayerId(value);
    }

    private nickCheckCount:number = 0;

    private get Nick(): boolean {
        if (this.nick || this.nickCheckCount > 3) return false;

        this.nickCheckCount++;
        if (this.nickCheckCount < 3) return false;

        const mem = [ this._localUserId ];
        ZepetoWorldHelper.GetUserInfo(mem, (info: Users[]) => {
            this.nick = info[0].name;
        }, (error) => {
            return console.log(error);
        });
        return true;
    }

    private Start() {
        this.rankUICloseButton.onClick.AddListener(() => {
            this.rankUI.SetActive(false);
        });
    }

    /* From GameManager */
    public RemoteStart(userId: string) {
        this._localUserId = userId;

        /* HorrorZone */
        // World
        for(let i = 0; i < this.horror_RankPanels_World.childCount; i++) {
            const panel = this.horror_RankPanels_World.GetChild(i);
            const ui = this.Processing_TimeAttack_SetRankPanel_Sprite(panel, i, this.grayProfile);
            this.horror_RankUIs_World.push(ui);
        }

        for (let i = 0; i<this.horror_RankPanels_All.childCount; i++) {
            const panel = this.horror_RankPanels_All.GetChild(i);
            const ui = this.Processing_TimeAttack_SetRankPanel(panel, i);
            this.horror_RankUIs_All.push(ui);
        }


        for(let i=0; i<this.horror_RankPanels_Notice.childCount; i++) {
            const panel = this.horror_RankPanels_Notice.GetChild(i);
            const ui = this.Processing_TimeAttack_SetRankPanel_Sprite(panel, i, this.purpleProfile);
            this.horror_RankUIs_Notice.push(ui);
        }

        // for(let i=0; i<this.horror_RankPanels_Result.childCount; i++) {
        //     const panel = this.horror_RankPanels_Result.GetChild(i);
        //     const ui = this.Processing_TimeAttack_SetRankPanel(panel, i);
        //     this.horror_RankUIs_Result.push(ui);
        // }

        // Local
        if(this.horror_LocalRankPanel_All) {
            const panel = this.horror_LocalRankPanel_All;
            const ui = this.Processing_TimeAttack_SetRankPanel(panel, -1);
            this.horror_LocalRankUI_All = ui;
            this.localRankUI.push(ui);

            // Rank Text
            this.horror_LocalRankUI_Notice_RankTexts.push(panel.GetChild(panel.childCount -1).GetComponent<TextMeshProUGUI>());
        }


        if(this.horror_LocalRankPanel_Notice) {
            const panel = this.horror_LocalRankPanel_Notice;
            const ui = this.Processing_TimeAttack_SetRankPanel_Sprite(panel, -1, this.purpleProfile);
            this.horror_LocalRankUI_Notice = ui;
            this.localRankUI.push(ui);

            // Rank Text
            this.horror_LocalRankUI_Notice_RankTexts.push(panel.GetChild(panel.childCount -1).GetComponent<TextMeshProUGUI>());
        }


        // if(this.horror_LocalRankPanel_Result) {
        //     const panel = this.horror_LocalRankPanel_Result;
        //     const ui = this.Processing_TimeAttack_SetRankPanel(panel, -1);
        //     this.horror_LocalRankUI_Result = ui;
        //     this.localRankUI.push(ui);
        // }
        // Update Data
        this.Horror_SetLocalRankUI(0, false);
    }


    /* Set Local Rank UI */
    public Horror_SetLocalRankUI(timer: number, rank: boolean = true) {
        this.horror_LocalRankUI_All.text_Id.text = this.ProcessingId(this.nick);
        this.horror_LocalRankUI_Notice.text_Id.text = this.ProcessingId(this.nick);
        // this.horror_LocalRankUI_Result.text_Id.text = this.ProcessingId(this.nick);
        // this.horror_LocalRankUI_Result.text_Score.text = this.FormatTimerText(timer);

        rank = rank && timer > 0;
        if (rank) this.Horror_RankScore(timer);
        else this.Horror_UpdateRank();
    }

    private ProcessingId(beforeId: string): string {
        if (!beforeId) return `***`;
        if (beforeId.length < 8) {
            return beforeId;
        }
        return `${beforeId.slice(0, 6)}***`;
    }

    private FormatTimerText(timer: number, formating: boolean = false) {
        const time: number = formating ? timer * 0.001 : timer;
        const minutes = Mathf.Floor(time / 60);
        const seconds = Mathf.Floor(time % 60);
        const millSec = Mathf.Floor((time * 100) % 100);
        const formattedString =
        `${minutes.toString().padStart(2, RankData.Zero)}:${seconds.toString().padStart(2, RankData.Zero)}:${millSec.toString().padStart(2, RankData.Zero)}`;
        return formattedString;
    }

     /* Update Local Player's Score */
    private Horror_RankScore(time: number) {
        LeaderboardAPI.SetScore(RankData.HorrorZoneTimeId, time * 1000, (result: SetScoreResponse) => {
            this.SendUpdateRank(RankData.HorrorZone);
        }, (error:string) => {
            console.error(` UpdateScore error : ${error} `);
        })
    }

    /* Leaderboard Send Update Signal */
    private SendUpdateRank(rankType:RankData) {
        const data = new RoomData();
        data.Add(EVENT_MESSAGE.Type, rankType);
        MultiplayManager.instance.room.Send(EVENT_MESSAGE.LeaderBoard_Update, data.GetObject());
    }

    /* Leaderboard + UserInfo */
    public Horror_UpdateRank() {
        console.log(`[LeaderBoard] Try to GetRangeRank ${RankData.HorrorZoneTimeId}`);
        //
        LeaderboardAPI.GetRangeRank(RankData.HorrorZoneTimeId, RankData.Rank_Start, RankData.Rank_End, ResetRule.none, false, (result: GetRangeRankResponse) => {
            console.log(`[LeaderBoard] success GetRangeRank`);
                
            /* Get Player Datas */
            let cheatUser = 0;
            const mems: string[] = [];
            const rankList = result.rankInfo.rankList;
            if (rankList) {
                for (let i = 0; i < rankList.length; i++) {
                    if (RankData.Rank_End > i) {
                        const data = rankList[i];
                        if (data.score == 0) cheatUser++;
                        else mems.push(data.member);
                    } else {
                        break;
                    }
                }
            }
            if (mems.length < 1) return;
            rankList.splice(0, cheatUser);

            /* Set Local UI */
            const myRank = result.rankInfo.myRank;
            if (!this.nick || this.nick == DATA_TYPE.Empty || this.nick == DATA_TYPE.NULL) {
                if (!myRank.name) this.Nick;
                else this.nick = myRank.name;
            }
            for(const rankText of this.horror_LocalRankUI_Notice_RankTexts) rankText.text = this.FormatRankText(myRank.rank -cheatUser);
            this.horror_LocalRankUI_All.text_Score.text = this.FormatTimerText(myRank.score, true);
            this.horror_LocalRankUI_All.text_Id.text = this.ProcessingId(this.nick);
            this.horror_LocalRankUI_Notice.text_Score.text = this.FormatTimerText(myRank.score, true);
            this.horror_LocalRankUI_Notice.text_Id.text = this.ProcessingId(this.nick);

            // Profile
            ZepetoWorldHelper.GetProfileTexture(this._localUserId, (texture: Texture) => {
                const rect: Rect = new Rect(0, 0, texture.width, texture.height);
                const sprite = Sprite.Create(texture as Texture2D, rect, new Vector2(0.5, 0.5));
                
                this.horror_LocalRankUI_Notice.profile.sprite = sprite;
            }, (error) => {
                console.log(error);
            });

            /* Get Player ID */
            ZepetoWorldHelper.GetUserInfo(mems, (_info: Users[]) => {
                
                /* Text Clear */
                for(let i=0; i<this.horror_RankUIs_World.length; i++) {
                    const ui = this.horror_RankUIs_World[i];
                    ui.text_Id.text = RankData.Empty_Line;
                    ui.text_Score.text = RankData.Zero_Time;
                    ui.profile.sprite = this.grayProfile;
                }
                for(let i=0; i<this.horror_RankUIs_All.length; i++) {
                    const ui = this.horror_RankUIs_All[i];
                    ui.text_Id.text = RankData.Empty_Line;
                    ui.text_Score.text = RankData.Zero_Time;
                }
                for(let i=0; i<this.horror_RankUIs_Notice.length; i++) {
                    const ui = this.horror_RankUIs_Notice[i];
                    ui.text_Id.text = RankData.Empty_Line;
                    ui.text_Score.text = RankData.Zero_Time;
                    ui.profile.sprite = this.purpleProfile;
                }
                // for(let i=0; i<this.horror_RankUIs_Result.length; i++) {
                //     const ui = this.horror_RankUIs_Result[i];
                //     ui.text_Id.text = RankData.Empty_Line;
                //     ui.text_Score.text = RankData.Zero_Time;
                // }

                /* Update Rank Text */
                if (rankList) {
                    for (let i=0; i < rankList.length; i++) {
                        if(RankData.Rank_End <= i) break;

                        const data = rankList[i];
                        if(this.horror_RankUIs_World.length > i) {
                            const ui = this.horror_RankUIs_World[i];
                            ui.text_Id.text = this.ProcessingId(data.name);
                            ui.text_Score.text = this.FormatTimerText(data.score, true);
                            ui.profile.sprite = this.grayProfile;
                        }
                        if(this.horror_RankUIs_All.length > i) {
                            const ui = this.horror_RankUIs_All[i];
                            ui.text_Id.text = this.ProcessingId(data.name);
                            ui.text_Score.text = this.FormatTimerText(data.score, true);
                        }
                        if(this.horror_RankUIs_Notice.length > i) {
                            const ui = this.horror_RankUIs_Notice[i];
                            ui.text_Id.text = this.ProcessingId(data.name);
                            ui.text_Score.text = this.FormatTimerText(data.score, true);
                            ui.profile.sprite = this.purpleProfile;
                        }
                        // if(this.horror_RankUIs_Result.length > i) {
                        //     const ui = this.horror_RankUIs_Result[i];
                        //     ui.text_Id.text = this.ProcessingId(data.name);
                        //     ui.text_Score.text = this.FormatTimerText(data.score, true);
                        // }
                        
                        // Profile
                        ZepetoWorldHelper.GetProfileTexture(data.member, (texture: Texture) => {
                            const rect: Rect = new Rect(0, 0, texture.width, texture.height);
                            const sprite = Sprite.Create(texture as Texture2D, rect, new Vector2(0.5, 0.5));
                            
                            if(this.horror_RankUIs_World.length  > i) this.horror_RankUIs_World[i].profile.sprite = sprite
                            if(this.horror_RankUIs_Notice.length > i) this.horror_RankUIs_Notice[i].profile.sprite = sprite;
                        }, (error) => {
                            console.log(error, data.member);
                        });
                    }
                }
            }, (error) => {
                return console.log(error);
            });
        }, (error: string) => {
            console.error(error);
        });
    }

    private Processing_TimeAttack_SetRankPanel_Sprite(panel:Transform, index:number, sprite:Sprite) {
        return this.Processing_RankPanel_Sprite(panel, index, RankData.Zero_Time, sprite);
    }

    private Processing_TimeAttack_SetRankPanel(panel:Transform, index:number) {
        return this.Processing_RankPanel(panel, index, RankData.Zero_Time);
    }

    private Processing_RankPanel_Sprite(panel:Transform, index:number, score:string, sprite:Sprite) {
        const text_Id = panel.GetChild(0).GetComponent<TextMeshProUGUI>();
        const text_Score = panel.GetChild(1).GetComponent<TextMeshProUGUI>();
        const profile = panel.GetChild(2).GetChild(0).GetComponent<Image>();
        
        /* Set Clear */
        text_Id.text = RankData.Empty_Line;
        text_Score.text = score;
        profile.sprite = sprite;
        
        /* Pushed Array */
        const ui: RankUI = {
            panel: panel.gameObject,
            rank: index,
            text_Id: text_Id,
            text_Score: text_Score,
            profile: profile,
        };
        return ui;
    }

    private Processing_RankPanel(panel:Transform, index:number, score:string) {
        const text_Id = panel.GetChild(0).GetComponent<TextMeshProUGUI>();
        const text_Score = panel.GetChild(1).GetComponent<TextMeshProUGUI>();
        
        /* Set Clear */
        text_Id.text = RankData.Empty_Line;
        text_Score.text = score;
        
        /* Pushed Array */
        const ui: RankUI = {
            panel:panel.gameObject,
            rank:index,
            text_Id:text_Id,
            text_Score:text_Score,
            profile:null,
        };
        return ui;
    }

    private FormatRankText(rank:number) {
        if (rank == 1) return `${rank}st`;
        else if (rank == 2) return `${rank}nd`;
        else if (rank == 3) return `${rank}rd`;
        else if (rank == 0) return RankData.Empty_Line;
        return `${rank}th`;
    }

    public OpenRankUI() {
        this.rankUI.SetActive(true);
    }

    public SetTreasureHuntRank(score: number) {
        LeaderboardAPI.SetScore(RankData.TreasureHuntId, score, (result: SetScoreResponse) => {
            console.log(`score: ${score}`);
        });
    }
}

interface RankUI {
    panel: GameObject,
    rank: number,
    text_Id: TextMeshProUGUI,
    text_Score: TextMeshProUGUI,
    profile: Image,
}