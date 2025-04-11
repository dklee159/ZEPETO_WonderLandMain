import { GameObject, Material, Time, Vector2 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import MaterialController from '../World/MaterialController';

export default class MaterialManager extends ZepetoScriptBehaviour {
    /* Singleton */
    private static _instance: MaterialManager;
    public static get Instance(): MaterialManager {
        if (!MaterialManager._instance) {
            const managerObj = GameObject.Find("MaterialManager");
            if (managerObj) MaterialManager._instance = managerObj.GetComponent<MaterialManager>();
        }
        return MaterialManager._instance;
    }

    public static materialEffects: MaterialController[] = [];
    private readonly tex: string = "_MainTex";
    @SerializeField() private skyBox: Material;
    @SerializeField() private nightEffects: GameObject;

    Awake() {
        MaterialManager._instance = this;     
    }
    
    private FixedUpdate() {
        this.SetMaterials();
    }

    private SetMaterials() {
        if(!MaterialManager.materialEffects) return;
        if(MaterialManager.materialEffects.length == 0) return;

        for(const controller of MaterialManager.materialEffects) {
            controller.curX += Time.deltaTime * controller.speedX;
            controller.curY += Time.deltaTime * controller.speedY;
            controller.mat.SetTextureOffset(this.tex, new Vector2(controller.curX, controller.curX));
        }
    }

    public GetCurrentSkyBox() {
        return this.skyBox.GetFloat("_GradientFadeEnd");
    }

    public SetSkyBox(light: boolean) {
        if (light) {
            this.skyBox.SetFloat("_GradientFadeBegin", 0.62)
            this.skyBox.SetFloat("_GradientFadeEnd", 1)
            this.skyBox.SetFloat("_StarLayer1MaxRadius", 0)
            this.nightEffects.SetActive(false);
        } else {
            this.skyBox.SetFloat("_GradientFadeBegin", -1)
            this.skyBox.SetFloat("_GradientFadeEnd", -1)
            this.skyBox.SetFloat("_StarLayer1MaxRadius", 0.0068)
            this.nightEffects.SetActive(true);
        }
    }
}