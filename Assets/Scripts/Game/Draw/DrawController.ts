import { AnimationClip, Animator, GameObject, Mathf, Random, Sprite, WaitForEndOfFrame, WaitForSeconds } from 'UnityEngine';
import { Button, Image } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { TextMeshProUGUI } from 'TMPro';
import DataManager from '../../Manager/DataManager';
import { EVENT_MESSAGE, WonderCollectionList, WonderDraw } from '../../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import QuestManager from '../../Manager/QuestManager';

export default class DrawController extends ZepetoScriptBehaviour {

    @SerializeField() private noticePanel: GameObject;
    @SerializeField() private noticeConfirmButton: Button;
    @SerializeField() private noticeCloseButton: Button;

    @SerializeField() private notEnoughPanel: GameObject;
    @SerializeField() private notEnoughCloseButton: Button;
    @SerializeField() private notEnoughConfirmButton: Button;

    @SerializeField() private buyDrawUI: GameObject;
    @SerializeField() private buyDrawConfirmButton: Button;
    @SerializeField() private buyDrawCancelButton: Button;
    @SerializeField() private buyDrawCloseButton: Button;
    
    @SerializeField() private drawResultUI: GameObject;
    @SerializeField() private drawResultConfirm: Button;
    @SerializeField() private drawResultCancel: Button;
    @SerializeField() private drawResultClose: Button;
    @SerializeField() private drawResultImagePanel: GameObject;

    @SerializeField() private drawResultBackground: GameObject;
    // @SerializeField() private resultIcons: GameObject[] = [];
    
    @SerializeField() private capsulePanel: GameObject;
    @SerializeField() private capsuleTopImage: Image;
    @SerializeField() private capsuleBottomImage: Image;
    @SerializeField() private capsuleTriggerButton: Button;

    @SerializeField() private resultPrefabs: GameObject[];
    @SerializeField() private topImages: Sprite[] = [];
    @SerializeField() private bottomImages: Sprite[] = [];

    @SerializeField() private drawCoin: number = 20;
    @SerializeField() private coinPanel: TextMeshProUGUI;

    @SerializeField() private completePanel: GameObject;
    @SerializeField() private completePanelCloseButton: Button;

    private _isFirst: boolean = true;
    private _capsuleAnimator: Animator;
    private _openOngoing: boolean = false;

    Start() {    
        this.noticeConfirmButton.onClick.AddListener(() => {
            this.noticePanel.SetActive(false);
            this.buyDrawUI.SetActive(true);
        })

        this.noticeCloseButton.onClick.AddListener(() => {
            this.noticePanel.SetActive(false);
            this.buyDrawUI.SetActive(true);
        })

        this.notEnoughCloseButton.onClick.AddListener(() => {
            this.notEnoughPanel.SetActive(false);
        })

        this.notEnoughConfirmButton.onClick.AddListener(() => {
            this.notEnoughPanel.SetActive(false);
        })

        this.buyDrawConfirmButton.onClick.AddListener(() => {
            //TODO 동전 수 체크
            const wonderCoin = DataManager.Instance.PlayerDB.wonderCoin
            if (wonderCoin >= this.drawCoin) {
                DataManager.Instance.PlayerDB.wonderCoin = wonderCoin - this.drawCoin;

                this.capsulePanel.SetActive(true);
                this.drawResultBackground.SetActive(true);

                this.ClearChild();
                const randomIndex = Mathf.Floor(Random.Range(0, this.topImages.length))
                this.capsuleTopImage.sprite = this.topImages[randomIndex];
                this.capsuleBottomImage.sprite = this.bottomImages[randomIndex];

                this._capsuleAnimator.SetInteger(EVENT_MESSAGE.CapsuleState, 1);   
            } else {
                this.notEnoughPanel.SetActive(true);
                this.drawResultBackground.SetActive(false);
            }
            this.buyDrawUI.SetActive(false);
        })

        this.buyDrawCancelButton.onClick.AddListener(() => {
            this.buyDrawUI.SetActive(false);
            this.drawResultBackground.SetActive(false);
        })

        this.buyDrawCloseButton.onClick.AddListener(() => {
            this.buyDrawUI.SetActive(false);
            this.drawResultBackground.SetActive(false);
        })

        this.drawResultConfirm.onClick.AddListener(() => {
            this.ClearChild();
            this.drawResultUI.SetActive(false);
            this.buyDrawUI.SetActive(true);
            this._openOngoing = false;
        })

        this.drawResultCancel.onClick.AddListener(() => {    
            this.ClearChild();
            this.drawResultBackground.SetActive(false);
            this.drawResultUI.SetActive(false);
            this._openOngoing = false;
        })

        this.drawResultClose.onClick.AddListener(() => {
            this.ClearChild();
            this.drawResultBackground.SetActive(false);
            this.drawResultUI.SetActive(false);
            this._openOngoing = false;
        })

        this.capsuleTriggerButton.onClick.AddListener(() => {
            if (this._openOngoing) return;
            this._openOngoing = true
            this._capsuleAnimator.SetInteger(EVENT_MESSAGE.CapsuleState, 2);
        })

        this.completePanelCloseButton.onClick.AddListener(() => {
            // this.ClearChild();
            this.completePanel.SetActive(false);
            this.drawResultUI.SetActive(true);
            // this.drawResultBackground.SetActive(false);
            // this._openOngoing = false;
        })
        
        this._capsuleAnimator = this.capsulePanel.GetComponent<Animator>();
    }

    public InitPlayerDrawData(drawData: WonderDraw[]) {
        for (const data of drawData) {
            if (data.amount > 0) {
                this.drawResultBackground.transform.GetChild(RewardType[data.id]).gameObject.SetActive(true);
                this.drawResultBackground.transform.GetChild(RewardType[data.id]).GetComponentInChildren<TextMeshProUGUI>().text = data.amount.toString();
            }
        }

        this.coinPanel.text = this.drawCoin.toString();
    }

    public OpenUI() {
        if (this._isFirst) {
            this._isFirst = false
            this.noticePanel.SetActive(true);
        } else this.buyDrawUI.SetActive(true);
    }

    public OpenResultUI() {
        this.capsulePanel.SetActive(false);
        this._capsuleAnimator.SetInteger(EVENT_MESSAGE.CapsuleState, 0);        
        QuestManager.Instance.OnPlayGame();
        this.drawResultUI.SetActive(true);
        this.ChooseRandomReward()        
    }

    private ClearChild() {
        const childCount = this.drawResultImagePanel.transform.childCount;
        if (childCount > 0) {  
            for (let i = 0; i < childCount; i++) {
                const child = this.drawResultImagePanel.transform.GetChild(i).gameObject;
                GameObject.Destroy(child);
            }         
        }
    }

    private ChooseRandomReward() {
        const randomRewardIndex = Mathf.Floor(Random.Range(0, this.resultPrefabs.length));
        const reward = this.resultPrefabs[randomRewardIndex];

        const resultPrefab = GameObject.Instantiate(reward ,this.drawResultImagePanel.transform) as GameObject;
        resultPrefab.transform.SetParent(this.drawResultImagePanel.transform, false);

        this.UpdateDrawResult(reward.name);
    }

    private UpdateDrawResult(reward: string) {
        const rewardType = RewardType[reward]        
        if (reward == "Coin" || reward == "Bomb") {
            if (reward == "Coin") DataManager.Instance.PlayerDB.wonderCoin += 20
        } else {
            const drawData = DataManager.Instance.PlayerDB.wonderDraw;
            
            let drawCount = 0
            for (const data of drawData) {
                if (data.id == reward) {
                    if (!this.drawResultBackground.transform.GetChild(rewardType).gameObject.activeSelf) {
                        this.drawResultBackground.transform.GetChild(rewardType).gameObject.SetActive(true);
                    }
                    data.amount++;
                    this.drawResultBackground.transform.GetChild(rewardType).GetComponentInChildren<TextMeshProUGUI>().text = data.amount.toString();
                }
    
                if (data.amount > 0) drawCount++;

                //TODO 만약 다모았을경우 아닐경우
                if (drawCount === 4) {
                    this.drawResultUI.SetActive(false);
        
                    //TODO 배지
                    // const collectionData = DataManager.Instance.PlayerDB.wonderCollection;
                    // for (const badge of collectionData) {
                    //     if (badge.id == WonderCollectionList.Wonder_Badge_Hall) badge.has = true;
                    // }
                    DataManager.Instance.AddBadge();

                    this.completePanel.SetActive(true);
        
                    for (const data of drawData) {
                        data.amount--;
                        this.drawResultBackground.transform.GetChild(RewardType[data.id]).GetComponentInChildren<TextMeshProUGUI>().text = data.amount.toString();
        
                        if (data.amount == 0) {
                            this.drawResultBackground.transform.GetChild(RewardType[data.id]).gameObject.SetActive(false);
                        }
                    }
                }
            }
        }
    }
}

enum RewardType {
    Land = 0,
    Der = 1,
    Won = 2,
    K = 3,
    Bomb = 4,
    Coin = 5
}