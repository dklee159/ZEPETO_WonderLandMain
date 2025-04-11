import { GameObject } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import DataManager from './DataManager';
import DrawController from '../Game/Draw/DrawController';

export default class DrawManager extends ZepetoScriptBehaviour {

    /* Singleton */
    private static _instance: DrawManager;
    public static get Instance(): DrawManager {
        if (!DrawManager._instance) {
            const managerObj = GameObject.Find("DrawManager");
            if (managerObj) DrawManager._instance = managerObj.GetComponent<DrawManager>();
        }
        return DrawManager._instance;         
    }
    
    @SerializeField() private _drawController: GameObject;
    private drawController: DrawController;

    public RemoteStart() {
        this.drawController = this._drawController.GetComponent<DrawController>();
        this.drawController.InitPlayerDrawData(DataManager.Instance.PlayerDB.wonderDraw);        
    }

}