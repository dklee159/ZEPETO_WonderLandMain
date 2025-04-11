import { Material, Renderer } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import MaterialManager from '../Manager/MaterialManager';

export default class MaterialController extends ZepetoScriptBehaviour {

    /* Properties */
    public speedX:number = 0.1;
    public speedY:number = 0.1;
    public curX:number = 0.1;
    public curY:number = 0.1;

    private _mat: Material;
    public get mat(): Material { return this._mat; }
    public set mat(value: Material) { this._mat = value; }

    Start() {
        this.curX = this.GetComponent<Renderer>().material.mainTextureOffset.x;
        this.curY = this.GetComponent<Renderer>().material.mainTextureOffset.y;

        this.mat = this.GetComponent<Renderer>().material;

        MaterialManager.materialEffects.push(this);
    }
}