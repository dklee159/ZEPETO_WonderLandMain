import { Collider } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import TourManager from './TourManager';

export default class TourPhotoController extends ZepetoScriptBehaviour {

    private OnTriggerEnter(coll: Collider) {                      
        if (coll !== ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) return;

        TourManager.Instance.TakeBalloonPhoto();        
    }

}