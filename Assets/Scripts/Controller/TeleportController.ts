import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Animator, Transform, WaitForSeconds } from 'UnityEngine';
import UIManager from '../Manager/UIManager';
import GameManager from '../GameManager';
import HorrorZoneManager from '../Game/HorrorZone/HorrorZoneManager';
import { Anim, ScreenCanvasType, ZoneType } from '../../ZepetoScripts/SyncHelper/TypeSyncHelper';
import MultiplayManager from '../../ZepetoScripts/Multiplay/MultiplayManager';
import TransformSyncHelper from '../../ZepetoScripts/SyncHelper/TransformSyncHelper';
import SDManager from '../Manager/SDManager';
import EquipManager from '../Manager/EquipManager';

export default class TeleportController extends ZepetoScriptBehaviour {

    @Header("Zones")
    @SerializeField() private jailZone: Transform;
    
    @SerializeField() private horrorZone_Game: Transform;
    @SerializeField() private horrorZone_Exit: Transform;

    public TeleportPlayer(sessionId: string, targetZone: ZoneType) {
        const isLocal = MultiplayManager.instance.room.SessionId === sessionId;

        /* Get Player Datas */
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        const transformSyncHelper = character.GetComponent<TransformSyncHelper>();

        console.log(`[ZoneMoveManager] ${isLocal ? "Local":"Other"} ${character} teleport to ${ZoneType[targetZone]}....!`);

        /* Teleport */
        if (targetZone == ZoneType.HorrorZoneEntrance) {
            if (isLocal) this.StartCoroutine(this.Fading(targetZone));
            else character.transform.position = this.jailZone.position;                
            
            transformSyncHelper.SyncPosition = false;
            transformSyncHelper.SyncRotation = false;            
        
        } else if (targetZone === ZoneType.HorrorZoneExit){
            if (isLocal) this.StartCoroutine(this.Fading(targetZone));

            transformSyncHelper.SyncPosition = true;
            transformSyncHelper.SyncRotation = true;

            // switch (+targetZone) {
            //     case ZoneType.Main:
            //         if(isLocal) GameManager.instance.ChangeCamOutdoor(true);
            //         if(isLocal) this.ZoneOjbectActivator(ZoneType.Main);
            //         character.Teleport(this.mainZone.position, this.mainZone.rotation);
            //         break;

            //     case ZoneType.Main_Hall:
            //         if(isLocal) GameManager.instance.ChangeCamOutdoor(true);
            //         if(isLocal)this.ZoneOjbectActivator(ZoneType.Main);
            //         character.Teleport(this.mainZone_Hall.position, this.mainZone_Hall.rotation);
            //         if(isLocal) this.RotateCamera(90);
            //         break;

            //     case ZoneType.BalloonZone:
            //         character.Teleport(this.balloonZone.position, this.balloonZone.rotation);
            //         break;
                
            //     case ZoneType.PlayZone:
            //         character.Teleport(this.playZone.position, this.playZone.rotation);
            //         break;

            //     case ZoneType.WonderHallZone:
            //         if(isLocal) GameManager.instance.ChangeCamOutdoor(false);
            //         if(isLocal) this.ZoneOjbectActivator(ZoneType.WonderHallZone);
            //         character.Teleport(this.wonderHallZone.position, this.wonderHallZone.rotation);
            //         if(isLocal) this.RotateCamera(-90);
            //         break;
            // }

            // /* Controller ON */
            // GameManager.instance.FinishTeleportZone(targetZone);
            // // if(isLocal) GameManager.instance.LocalPlayerControllerSet(true);
        }
    }

    /* Start Loading */
    private *Fading(targetZone: ZoneType) {
        const fadeUI = UIManager.Instance.GetScreenImage(ScreenCanvasType.Fade);        
        fadeUI.GetComponent<Animator>().SetTrigger(Anim.Active);

        // // Controller OFF
        // GameManager.instance.LocalPlayerControllerSet(false);
        // const controller = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character.characterController;
        yield new WaitForSeconds(1);
        switch (+targetZone) {
            case ZoneType.HorrorZoneEntrance:
                GameManager.Instance.HorrorZoneEnter();         
                break;
            case ZoneType.HorrorZoneExit:
                GameManager.Instance.HorrorZoneExit();
                break;

            // case ZoneType.HorrorZone_Game:
            //     GameManager.instance.ChangeHorrorCam(true);
            //     UIManager.instance.HorrorGamePanelVisibler(true);

            //     this.RotateCamera(90);
            //     this.ZoneOjbectActivator(ZoneType.HorrorZone_Game);
            //     break;

            // case ZoneType.WonderHallZone_Game_JG:
            //     MinigameJGManager.instance.onPostMove();
            //     this.ZoneOjbectActivator(ZoneType.WonderHallZone_Game_JG);
            //     break;

            // case ZoneType.WonderHallZone_Game_NT:
            //     MinigameNTManager.instance.onPostMove();
            //     this.ZoneOjbectActivator(ZoneType.WonderHallZone_Game_NT);
            //     break;    
    
        }

        // // Teleport
        const character = ZepetoPlayers.instance.GetPlayer(MultiplayManager.instance.room.SessionId).character;
        switch(+targetZone) {
            case ZoneType.HorrorZoneEntrance:
                character.Teleport(this.horrorZone_Game.position, this.horrorZone_Game.rotation);
                HorrorZoneManager.Instance.GameReady();
                EquipManager.Instance.InvisibleAll();
                SDManager.Instance.Invisible();
                break;
            case ZoneType.HorrorZoneExit:
                character.Teleport(this.horrorZone_Exit.position, this.horrorZone_Exit.rotation);
                EquipManager.Instance.VisibleAll();
                SDManager.Instance.Visible();
                break;
            
                
                // case ZoneType.HorrorZone_Game:
                // character.Teleport(this.horrorZone.position, this.horrorZone.rotation);
                // break;

            // case ZoneType.WonderHallZone_Game_JG:
            //     character.Teleport(this.wonderHallZone_GameJG.position, this.wonderHallZone_GameJG.rotation);
            //     break;
    
            // case ZoneType.WonderHallZone_Game_NT:
            //     character.Teleport(this.wonderHallZone_GameNT.position, this.wonderHallZone_GameNT.rotation);
            //     break;    
        }
        fadeUI.GetComponent<Animator>().SetTrigger(Anim.Blackout);
        yield new WaitForSeconds(2);
        fadeUI.GetComponent<Animator>().SetTrigger(Anim.BackToIdle);
        // // Controller ON
        // GameManager.instance.FinishTeleportZone(targetZone);
    }

}