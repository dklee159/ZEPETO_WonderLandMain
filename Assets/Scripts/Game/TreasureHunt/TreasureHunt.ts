import { GameObject, Mathf, Random, Time, Transform, Animator, WaitForSeconds } from "UnityEngine";
import { Button, Text } from "UnityEngine.UI";
import {
    ZepetoCamera,
    ZepetoCharacter,
    ZepetoPlayers,
} from "ZEPETO.Character.Controller";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import Chest from "./Chest";
import UIManager from "../../Manager/UIManager";
import { ScreenCanvasType, Anim } from "../../../ZepetoScripts/SyncHelper/TypeSyncHelper";
import LeaderBoardManager from "../../Manager/LeaderBoardManager";

export default class TreasureHunt extends ZepetoScriptBehaviour {
    @Header("Object")
    @SerializeField() private controlInteractions: GameObject[] = [];
    @SerializeField() private chestsParent: Transform;
    @SerializeField() private spawnPoint: Transform;
    @SerializeField() private cameraPoint: Transform;

    @Header("UI")
    @SerializeField() private panel_all: GameObject;
    @SerializeField() private panel_result: GameObject;
    @SerializeField() private panel_record: GameObject;
    @SerializeField() private txt_Timer: Text;
    @SerializeField() private txt_Score: Text;
    @SerializeField() private txt_resultScore: Text;
    @SerializeField() private btn_resultClose: Button;

    private localCharacter: ZepetoCharacter;
    private localCamera: ZepetoCamera;

    /* Game property */
    private isStart: boolean = false;
    private score: number = 0;
    private timer: number = 0;
    private readonly limitTime: number = 90;
    private readonly chestAmount: number = 20;
    private chestMap: Map<number, Chest> = new Map<number, Chest>();

    private set Score(score: number | string) {
        if (typeof score == "number") {
            this.score = score;
            this.txt_Score.transform.GetChild(0).gameObject.SetActive(true);
            this.txt_Score.text = `${score.toString()}p`;
        }
        else if (typeof score == "string") {
            this.txt_Score.transform.GetChild(0).gameObject.SetActive(false);
            this.txt_Score.text = score;
        }
    }
    private set Txt_Timer(timer: number) {
        this.txt_Timer.text = `${(this.limitTime - Mathf.Floor(timer)).toString()}sec`;
    }

    Start() {
        // 매핑
        for (let i = 0; i < this.chestsParent.childCount; i++) {
            this.chestMap.set(
                i,
                this.chestsParent.GetChild(i).GetComponent<Chest>()
            );
        }

        this.ChestForEach(chest => {
            chest.onTrigger.AddListener(() => {
                if (this.isStart) {
                    this.RandomOn();
                    chest.Off();
                    this.Score = this.score + 1;
                }
            });
        });

        this.btn_resultClose.onClick.AddListener(() => {
            this.panel_all.SetActive(false);
            this.panel_result.SetActive(false);
            this.controlInteractions.forEach((inter => {
                inter.SetActive(true);
            }));
            this.ChestAllOff();
        });

        this.ChestAllOff();
        this.panel_all.SetActive(false);
        this.panel_result.SetActive(false);
    }

    // 시작 메소드
    public StartTreasureHunt() {
        if (this.isStart) return;
        this.isStart = true;

        if (!this.localCharacter) {
            this.localCharacter =
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        }
        if (!this.localCamera) {
            this.localCamera = ZepetoPlayers.instance.ZepetoCamera;
        }

        /* init */
        this.timer = 0;
        this.Score = 0;
        this.Txt_Timer = 0;

        this.StartCoroutine(this.CorStartTreasureHunt());
    }
    private *CorStartTreasureHunt() {
        // teleport charcter
        const fadeUI = UIManager.Instance.GetScreenImage(ScreenCanvasType.Fade);        
        const anim = fadeUI.GetComponent<Animator>();
        anim.SetTrigger(Anim.Active);
        yield new WaitForSeconds(1);

        this.localCharacter.Teleport(
            this.spawnPoint.position,
            this.spawnPoint.rotation
        );

        const dist = this.localCamera.distance;

        if (dist <= 4) {
            while(this.localCamera.distance <= 4) {
                this.localCamera.DoZoom(4);
                yield null;
            }
        }
        else {
            while(this.localCamera.distance > 4) {
                this.localCamera.DoZoom(-4);
                yield null;
            }
        }

        // set camera pos, rot
        this.localCamera.StateMachine.Stop();
        this.localCamera.cameraParent.transform.position =
            this.cameraPoint.position;
        this.localCamera.cameraParent.transform.rotation =
            this.cameraPoint.rotation;
        this.localCamera.StateMachine.Start(this.localCamera.currentState);

        this.controlInteractions.forEach((inter => {
            inter.SetActive(false);
        }));
        anim.SetTrigger(Anim.Blackout);
        yield new WaitForSeconds(2);
        anim.SetTrigger(Anim.BackToIdle);

        // set ui
        this.panel_all.SetActive(true);
        this.panel_record.SetActive(true);
        this.panel_result.SetActive(false);
        this.Score = "START";

        // spawn chest
        this.SpawnChests();

        while (this.timer <= this.limitTime) {
            const prev = Mathf.Floor(this.timer);
            this.timer += Time.deltaTime;
            const curr = Mathf.Floor(this.timer);

            if (prev !== curr) {
                if (curr == 1) this.Score = 0;
                this.Txt_Timer = curr;
            }

            yield null;
        }

        this.FinishTreasureHunt();
    }
    private FinishTreasureHunt() {
        this.isStart = false;
        this.Score = "FINISH";
        this.panel_record.SetActive(false);
        this.panel_result.SetActive(true);
        this.txt_resultScore.text = `${this.score}p`;
        LeaderBoardManager.Instance.SetTreasureHuntRank(this.score);
        this.StartCoroutine(this.CorFinishTreasureHunt());
    }
    private * CorFinishTreasureHunt() {

    }

    private ChestForEach(onChest: (chest: Chest, index?: number) => void) {
        for (let i = 0; i < this.chestsParent.childCount; i++) {
            onChest(this.chestMap.get(i), i);
        }
    }
    private ChestOn(index: number) {
        this.chestMap.get(index).On();
    }
    private ChestOff(index: number) {
        this.chestMap.get(index).Off();
    }
    private GetInPool(): Chest {
        let i: number;
        this.ChestForEach((chest, index) => {
            if (!i) {
                if (!chest.gameObject.activeSelf) {
                    i = index;
                }
            }
        });

        return this.chestMap.get(i);
    }
    private RandomOn() {
        this.GetInPool().On();
    }
    private ChestAllOff() {
        this.ChestForEach(chest => {
            chest.Off();
        });
    }
    private SpawnChests() {
        const eNum: number = this.chestsParent.childCount - this.chestAmount;
        const aNum: number = Mathf.Floor(this.chestsParent.childCount / eNum);
        const r = Mathf.Floor(Random.Range(0, this.chestsParent.childCount));

        // mix and on
        this.ChestForEach((chest, i) => {
            if (Random.Range(0, 1) > 0.3) {
                const ranS = Mathf.Floor(
                    Random.Range(0, this.chestsParent.childCount)
                );
                chest.transform.SetSiblingIndex(ranS);
            }
            if ((r - i) % aNum != 0) this.ChestOn(i);
        });
    }
}
