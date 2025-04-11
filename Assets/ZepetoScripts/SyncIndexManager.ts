import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class SyncIndexManager extends ZepetoScriptBehaviour {
    /** This is used to give a unique ID to synchronization objects that do not have a separate ID. */

    public static SyncIndex:number = 0;
    public static SyncDestoryIndex:number = 0;
    
    public static SyncChairIndex:number = 0;

    public static GETSURE_ID: string;
    
    /** Wonder **/
    public static WonderCoin: number = 0;

    /* Hall */
    public static MISSION_CLEAR_JG: boolean = false;
    public static MISSION_CLEAR_NT: boolean = false;
    public static BADGE_HALL: boolean = false;

    public static TourBalloonIsPlay: boolean = false;

    public static WonderDraw_K: number = 0;
    public static WonderDraw_WON: number = 0;
    public static WonderDraw_DER: number = 0;
    public static WonderDraw_LAND: number = 0;

    public static WonderDrawData = [
        { id : "K", amount : 0 },
        { id : "Won", amount : 0 },
        { id : "Der", amount : 0 },
        { id : "Land", amount : 0 },
    ]
    public static DrawDataChanged: boolean = false;
}