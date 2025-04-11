export enum GameObjectStatus{
    Destroyed = -1,
    Disable, //does not yet supported
    Enable,
    Pause,
}

export enum MESSAGE {
    SyncDOTween = "SyncDOTween",
    SyncTransform = "SyncTransform",
    SyncTransformStatus = "SyncTransformStatus",
    SyncPlayer = "SyncPlayer",

    RequestPosition = "RequestPosition",
    ResponsePosition = "ResponsePosition",

    CheckServerTimeRequest = "CheckServerTimeRequest",
    CheckServerTimeResponse = "CheckServerTimeResponse",
    CheckMaster = "CheckMaster",
    MasterResponse = "MasterResponse",
    RequestInstantiateCache = "RequestInstantiateCache",
    Instantiate = "Instantiate",
    PauseUser = "PauseUser",
    UnPauseUser = "UnPauseUser",    
    
    animationParam = "animationParam",
    gestureName = "gestureName",  
    playerAdditionalValue = "playerAdditionalValue",
    additionalWalkSpeed = "additionalWalkSpeed",
    additionalRunSpeed = "additionalRunSpeed",
    additionalJumpPower = "additionalJumpPower",

    // SD
    InstantiatedSD = "InstantiatedSD",
    EquipSD = "EquipSD",
    UnequipSD = "UnequipSD",
    VisibleSD = "VisibleSD",
    InvisibleSD = "InvisibleSD",

    // Equip
    InstantiatedEquip = "InstantiatedEquip",
    EquipItem = "EquipItem",
    UnequipItem = "UnequipItem",
    VisibleItem = "VisibleItem",
    InvisibleItem = "InvisibleItem"
}

export enum EVENT_MESSAGE {    
    Name = "Name",
    Attach = "Attach",

    TourState = "TourState",
    ZoneType = "ZoneType",
    Type = "Type",
    IsTour = "IsTour",
    Play_Score = "Play_Score", 

    Equip = "Equip",
    Unequip = "Unequip",
    CapsuleState = "CapsuleState",

    Teleport = "Teleport",
    LeaderBoard_Update = "LeaderBoard_Update",

    PlayerDB = "PlayerDB",

    HTTP = "HTTP",
    GET = "GET",
    POST = "POST", 
    METHOD = "METHOD",
    URL = "URL",
    DATA = "DATA",

    GET_URL = "https://bkol779o38.execute-api.ap-northeast-2.amazonaws.com/WonderLandAPI/userdata/",
    POST_URL = "https://bkol779o38.execute-api.ap-northeast-2.amazonaws.com/WonderLandAPI/userdata",
    Data_Version = "1.1.0",
}

export enum DATA_TYPE {
    NULL = "null",
    Empty = "",
    READY = "READY",
    START = "START!",
    FINISH = "FINISH",
    TIME_UP = "TIME'S UP!",
    CLEAR = "GAME CLEAR!",
    GAME_OVER = "GAME OVER",
    AlreadyPlay = "AlreadyPlay",
    Success = "Success",
    Failed = "Failed",
    FeedMessage = "#K-WONDERLAND #WHATEVERYOUDREAM",
}

export enum UpdateOwner {
    Master, // Default
    Undefine, // It is separately designated by the user as a changeowner function.
}

export enum PositionInterpolationType {
    None = 0,
    Lerp,
    MoveToward,
    Estimate, // Estimate the speed with each received position and speed conversion value
}

export enum PositionExtrapolationType {
    Disable = 0,
    FixedSpeed,
    Estimate,
}

export enum SyncIndexType {
    AlreadyCreated, 
    Instantiate,
}

export enum ZoneType {
    NULL = -1,
    Main = 10,
    HorrorZoneEntrance = 70,
    HorrorZone_Game = 80,
    HorrorZoneExit = 90
}

export enum ScreenCanvasType {
    Load = "Loading_UI",
    Fade = "Fade",
    Teleport = "Teleport_UI",
    NONE = "",
}

export enum CameraView {
    Air,
    FPS,
    Default
}

export enum Anim {
    State = "State",
    MoveState = "MoveState",
    JumpState = "JumpState",
    LandingState = "LandingState",
    MotionSpeed = "MotionSpeed",
    FallSpeed = "FallSpeed",
    Acceleration = "Acceleration",
    MoveProgress = "MoveProgress",
    isSit = "isSit",
    isHold = "isHold",
    WonderState = "WonderState",
    
    // Wonder
    Play = "Play",
    Active = "Active",
    AnimationSpeed = "AnimationSpeed",
    Blackout = "Blackout",
    BackToIdle = "BackToIdle",    
    SiWooState = "SiWooState",    

    // NPC Animation
    isNPC = "isNPC",
    
}

export enum WonderState {
    NONE = 0,
    // Panel Button
    Hold_RightHand_Side = 52,
    Panel_Pose_1 = 131, Panel_Pose_2 = 132, Panel_Pose_3 = 133,
    Panel_LOCK_Pose_1 = 134, Panel_LOCK_Pose_2 = 135, Panel_LOCK_Pose_3 = 136,
    /* Horror Zone */
    H_Damaged = 310, H_Attack = 320, H_Death = 390,
}

export interface EquipData {
    key: string;
    sessionId: string;
    itemName: string;
    prevItemName: string;
    bone: number;
    prevBone: number;
    wonderState: number;
}

export enum EquipList {
    AnimMike = 0,
    AwardsMike_1 = 1,
    AwardsMike_2 = 2,
    Balloon_1 = 3,
    Balloon_2 = 4,
    Balloon_3 = 5,
    Balloon_4 = 6,
    Balloon_5 = 7,
    Balloon_6 = 8,
    Balloon_7 = 9,
    AwardsHead = 10,
    AwardsNeck_1 = 100,
    AwardsNeck_2 = 101,
}

export enum RankData {
    /* LeaderBoard Id */
    // HorrorZoneTimeId = "7e77bf91-28d4-4ff5-9e74-87d7cc08fc0c",
    // BumperZoneScoreId = "bf9adc91-1983-423b-9ae3-9135763d256b",
    // PlayZoneScoreId = "89f6994a-0fec-4cda-9a56-f161f7408783",
    TreasureHuntId = "83685891-b501-40ed-9bc1-85c1cb97ebf6",

    HorrorZoneTimeId = "37d71d9d-1f28-4e78-9818-4f6ae178d038",
    HorrorZoneTimeId_WEEK = "7e77bf91-28d4-4ff5-9e74-87d7cc08fc0c",      

    // Select Update
    HorrorZone = 300,

    StageZone = 2100,
    RunwayZone = 2200,
    
    /* Recycle Data */
    Rank_Start = 1,
    Rank_End = 10,
    Empty = "",
    Zero = "0",
    Empty_Line = "------",
    Zero_Time = "00:00:00",
}

export enum WorldId {
    WorldId_Land = "com.kofice.kwonderland",
    WorldId_Stage = "com.kofice.kwonderlandpop",
    WorldId_Studio = "com.kofice.kwonderdrama",
    WorldId_Awards = "com.kofice.kwonderawards",
}

export interface PlayerDB {
    userId: string,
    zepetoId : string,
    wonderCoin: number,
    wonderItems: WonderItem[],
    wonderCollection: WonderCollection[],
    dailyQuest : WonderQuest_Daily,
    weeklyQuest : WonderQuest_Weekly,
    monthlyQuest : WonderQuest_Monthly,
    wonderDraw: WonderDraw[],
    attend: Attend,
    version: string,
    isHSManager: boolean,
    SDCharacter : SD[],
    nextMonday: string,
    lastVisit: number,
    totalVisit: number,
    entryTicketAmount: number,
    entryTicket: EntryTicket
}

export interface EntryTicket {
    wonderland: boolean,
    stage: boolean,
    studio: boolean,
    awards: boolean,
}

export enum SDName {
    Siwoo = 0,
    Yubin = 1,
    Gabin = 2,
    Jia = 3,
    Hajun = 4,
}

export interface SD {
    Index : number,
    Has : boolean,
    Equip : boolean,
}

export enum WonderItemList {
    TICKET_HORROR = "TICKET_HORROR",
    TICKET_BALLOON = "TICKET_BALLOON",
    TICKET_BUMPER = "TICKET_BUMPER",
    TICKET_PLAY = "TICKET_PLAY",
}

export interface WonderItem {
    id:string,
    count:number,
}

export interface WonderCollection {
    id:string,
    has:boolean,
}

export interface Attend {
    lastDate: string,
    count: number,
}

export interface WonderDraw {
    id: string,
    amount: number
}

export enum WonderDrawList {
    K = "K",
    Won = "Won",
    Der = "Der",
    Land = "Land"
}

export interface QuestInfo_VisitCount extends QuestInfo {
    Visit_Wonder : number,
    Visit_Studio : number,
    Visit_Stage : number,
    Visit_Count : number
}

export enum QuestMenu {
    Daily = "dailyQuest",
    Weekly = "weeklyQuest",
    Monthly = "monthlyQuest"
}

export interface QuestInfo {
    Index : number,
    Name : string,
    CoinAmount : number,
    QuestAmount : number,
    QuestAcceptAmount : number,
    IsSuccess : boolean,
}

export interface WonderQuest_Daily {
    Visit_wonderland : QuestInfo,
    Visit_stage : QuestInfo,
    Visit_studio : QuestInfo,
    PlayGame_wonderland : QuestInfo,
    PlayGame_stage : QuestInfo,
    PlayGame_studio : QuestInfo,
    PostFeed_1 : QuestInfo,
}

export interface WonderQuest_Weekly {
    Visit_world_3 : QuestInfo_VisitCount,
    HangangRace_777 : QuestInfo,
    DailyQuest_3 : QuestInfo,
    Visit_continuous_3 : QuestInfo,
    Visit_continuous_5 : QuestInfo,
    PlayGame_10 : QuestInfo,
    PostFeed_3 : QuestInfo,
}

export interface WonderQuest_Monthly {
    Visit_world_ten : QuestInfo_VisitCount,
    Move_wonderAwards : QuestInfo,
    Visit_continous_7 : QuestInfo,
    WeeklyQuest_2 : QuestInfo,
    GatherCoin_5000 : QuestInfo,
    PlayGame_30 : QuestInfo,
    PostFeed_10 : QuestInfo,
}

export interface syncAnimator {
    Id: string,
    clipNameHash: number,
    clipNormalizedTime: number
}

export enum WonderCollectionList {
    // Badge 3
    Wonder_Badge_Hall = "Wonder_Badge_Hall",
    Wonder_Badge_Stage = "Wonder_Badge_Stage",
    Wonder_Badge_Studio = "Wonder_Badge_Studio",
    
    // Award Hidden
    Hiddle_Collection = "Hiddle_Collection",
}

export enum Tags {
    SpawnPoint = "SpawnPoint",
    Player = "Player",
    LocalPlayer = "LocalPlayer",
    Weapon = "Weapon",
    ShootTarget = "ShootTarget"
}

export enum ERROR {
    NOT_ENOUGH = "NOT ENOUGH....",
    NOT_MATCHED = "NOT MATCHED....",
    ALREADY_OPENED = "ALREADY OPENED....",
    NOT_FOUND_ITEM = "NOT FOUND ITEM........",
    ITS_FULL_PLAYERS = "IT'S FULL PLAYERS....",
    NOT_SELECTED_TYPE = "NOT SELECTED TYPE....",
    NOT_FOUND_PLAYER = "NOT FOUND PLAYER........",
    ROOM_DISCONNECTION = "ROOM DISCONNECTION......",
    NOT_FOUND_LOCAL_PLAYER = "NOT FOUND LOCAL PLAYER....",
    MINI_GAME_MANAGER_OVERLAPED = "MINI GAME MANAGER OVERLAPED......",
    NOT_FOUND_ZEPETO_ID_FROM_USER_ID = "NOT FOUND ZEPETO ID FROM USER ID........",


    TRANSLATE_NOT_FOUND = "Please, Attached component of text type!",
}