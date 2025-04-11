import { Collider } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import HorrorZoneManager from './HorrorZoneManager';
import { Tags } from '../../../ZepetoScripts/SyncHelper/TypeSyncHelper';

export default class HorrorZoneRidar extends ZepetoScriptBehaviour {

  OnTriggerEnter(collider: Collider) {    
    const isTarget = collider.gameObject.tag == Tags.ShootTarget;
    if(!isTarget) return;
    HorrorZoneManager.Instance.addOnRange( collider.gameObject.GetInstanceID() );
  }

  OnTriggerExit(collider: Collider) {    
    const isTarget = collider.gameObject.tag == Tags.ShootTarget;
    if(!isTarget) return;
    HorrorZoneManager.Instance.removeOnRange( collider.gameObject.GetInstanceID() );
  }
}