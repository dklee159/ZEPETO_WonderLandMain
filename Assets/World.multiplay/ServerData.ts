export const enum sEventArg {
  SyncPlayer = "SyncPlayer",
  SyncTransform = "SyncTransform",
  SyncTransformStatus = "SyncTransformStatus",
  SyncAnimator = "SyncAnimator",
  SyncDOTween = "SyncDOTween",
  ResponseAnimator = "ResponseAnimator",
  CheckServerTimeResponse = "CheckServerTimeResponse",
  CheckServerTimeRequest = "CheckServerTimeRequest",
  ChangeOwner = "ChangeOwner",
  CheckMaster = "CheckMaster",
  Instantiate = "Instantiate",
  RequestInstantiateCache = "RequestInstantiateCache",
  ResponsePosition = "ResponsePosition",
  MasterResponse = "MasterResponse",
  PauseUser = "PauseUser",
  UnPauseUser = "UnPauseUser",

  /** WonderLand */
  Teleport = "Teleport",
  
  HTTP = "HTTP",
  PlayerDB = "PlayerDB",
  AddBadge = "AddBadge",
  MissionClear = "MissionClear",
  MissionAllClear = "MissionAllClear",
  SetWonder = "SetWonder",
  LeaderBoard_Update = "LeaderBoard_Update",
  LoadData = "LoadData",
  State_OFF = "State_OFF",
  ChairSit = "ChairSit",
  ChairSitDown = "ChairSitDown",
  ChairSitUp = "ChairSitUp",
  Equip = "Equip",
  EquipChange = "EquipChange",
  UnEquip = "UnEquip",
  Pose = "Pose",
  TeleportZone = "TeleportZone",
  PhotoPose = "PhotoPose",
  Balloon_Play = "Balloon_Play",
  Balloon_Ride = "Balloon_Ride",
  Balloon_Ride_OFF = "Balloon_Ride_OFF",
  Play_Score = "Play_Score",
}

/*** Http Data Connection Service ***/
export const enum HttpData {
  GET = "GET",
  POST = "POST",
  GET_URL = "https://bkol779o38.execute-api.ap-northeast-2.amazonaws.com/WonderLandAPI/userdata/",
  POST_URL = "https://bkol779o38.execute-api.ap-northeast-2.amazonaws.com/WonderLandAPI/userdata",
  Data_Version = "0.9.0",
}

/** Wonder **/
export const enum StorageName {
  VisitCount = "VisitCount",
  PlayerData = "PlayerData",
  WorldData = "WonderWorldData_0.8.0",
}

export const enum MissionType {
  NONE = "NONE",
  JG = "JG", NT = "NT",
  Stage = "Stage", Runway = "Runway",
}

