import { SandboxPlayer } from "ZEPETO.Multiplay";
import { IModule } from "../IModule";
import {sVector3, sQuaternion, SyncTransform, PlayerAdditionalValue, ZepetoAnimationParam, EquipData } from "ZEPETO.Multiplay.Schema";
import { DataStorage } from "ZEPETO.Multiplay.DataStorage";
import { HttpService } from "ZEPETO.Multiplay.HttpService";
import { sEventArg } from '../../ServerData';

export default class SyncComponentModule extends IModule {
    private sessionIdQueue: string[] = [];
    private instantiateObjCaches : InstantiateObj[] = [];
    private masterClient: Function = (): SandboxPlayer | undefined => this.server.loadPlayer(this.sessionIdQueue[0]);
    private equipMap : Map<string, PlayerEquip> = new Map<string, PlayerEquip>();

    /* Game Trigger */
    private balloonState: boolean = false;
    private tourState: boolean = false;

    async OnCreate() {
        /**Zepeto Player Sync**/
        this.server.onMessage(MESSAGE.SyncPlayer, (client, message) => {
            const player = this.server.state.players.get(client.sessionId);
            if (player) {
                const animationParam = new ZepetoAnimationParam();
                player.animationParam = Object.assign(animationParam, message.animationParam);
                player.gestureName = message.gestureName ?? null;

                if (message.playerAdditionalValue) {
                    const pAdditionalValue = new PlayerAdditionalValue();
                    player.playerAdditionalValue = Object.assign(pAdditionalValue, message.playerAdditionalValue);
                }
            }
        });

        /**Transform Sync**/
        this.server.onMessage(MESSAGE.SyncTransform, (_client, message) => {
            const { Id, position, localPosition, rotation, scale, sendTime } = message;
            let syncTransform = this.server.state.SyncTransforms.get(Id.toString());

            if (!syncTransform) {
                syncTransform = new SyncTransform();
                this.server.state.SyncTransforms.set(Id.toString(), syncTransform);
            }

            Object.assign(syncTransform.position, position);
            Object.assign(syncTransform.localPosition, localPosition);
            Object.assign(syncTransform.rotation, rotation);
            Object.assign(syncTransform.scale, scale);
            syncTransform.sendTime = sendTime;
        });

        this.server.onMessage(MESSAGE.SyncTransformStatus, (_client, message) => {
            const syncTransform = this.server.state.SyncTransforms.get(message.Id);
            if(syncTransform !== undefined) {
                syncTransform.status = message.Status;
            }
        });

        /** Sync Animaotr **/
        this.server.onMessage(MESSAGE.SyncAnimator, (_client, message) => {
            const animator: SyncAnimator = {
                Id: message.Id,
                clipNameHash: message.clipNameHash,
                clipNormalizedTime: message.clipNormalizedTime,
            };
            const masterClient = this.masterClient();
            if (masterClient !== null && masterClient !== undefined) {
                this.server.broadcast(MESSAGE.ResponseAnimator + message.Id, animator, {except: masterClient});
            }
        });

        /** SyncTransform Util **/
        this.server.onMessage(MESSAGE.ChangeOwner, (client, message:string) => {
            this.server.broadcast(MESSAGE.ChangeOwner+message, client.sessionId);
        });

        this.server.onMessage(MESSAGE.Instantiate, (_client, message:InstantiateObj) => {
            const InstantiateObj: InstantiateObj = {
                Id: message.Id,
                prefabName: message.prefabName,
                ownerSessionId: message.ownerSessionId,
                spawnPosition: message.spawnPosition,
                spawnRotation: message.spawnRotation,
            };
            this.instantiateObjCaches.push(InstantiateObj);
            this.server.broadcast(MESSAGE.Instantiate, InstantiateObj);
        });

        this.server.onMessage(MESSAGE.RequestInstantiateCache, (client) => {
            for (const obj of this.instantiateObjCaches) {
                client.send(MESSAGE.Instantiate, obj);
            }
        });

        /**SyncDOTween**/
        this.server.onMessage(MESSAGE.SyncDOTween, (_client, message: syncTween) => {
            const tween: syncTween = {
                Id: message.Id,
                position: message.position,
                nextIndex: message.nextIndex,
                loopCount: message.loopCount,
                sendTime: message.sendTime,
            };
            const masterClient = this.masterClient();
            if (masterClient !== null && masterClient !== undefined) {
                this.server.broadcast(MESSAGE.ResponsePosition + message.Id, tween, {except: masterClient});
            }
        });

        /**Common**/
        this.server.onMessage(MESSAGE.CheckServerTimeRequest, (client, _message) => {
            let Timestamp = +new Date();
            client.send(MESSAGE.CheckServerTimeResponse, Timestamp);
        });

        this.server.onMessage(MESSAGE.CheckMaster, (_client, _message) => {
            console.log(`master->, ${this.sessionIdQueue[0]}`);
            this.server.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
        });

        this.server.onMessage(MESSAGE.PauseUser, (client) => {
            if(this.sessionIdQueue.includes(client.sessionId)) {
                const pausePlayerIndex = this.sessionIdQueue.indexOf(client.sessionId);
                this.sessionIdQueue.splice(pausePlayerIndex, 1);

                if (pausePlayerIndex == 0) {
                    console.log(`master->, ${this.sessionIdQueue[0]}`);
                    this.server.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
                }
            }
        });

        this.server.onMessage(MESSAGE.UnPauseUser, (client) => {
            if(!this.sessionIdQueue.includes(client.sessionId)) {
                this.sessionIdQueue.push(client.sessionId);
                this.server.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
            }
        });
        

        /** Custom Function */

        /*** Http Data Connection Service ***/
        this.server.onMessage(MESSAGE.HTTP, (client, message) => {
            console.log(`[MainServer Init Request] Sending Test ${message.METHOD} Request to ${message.URL} Via HTTPService`);
            if(message.METHOD == HttpData.GET) {
                this.SendRequest_GET(client, message.URL);

            } else if(message.METHOD == HttpData.POST) {
                this.SendRequest_POST(client, message.URL, message.DATA);
            }
        });

        this.server.onMessage(MESSAGE.PlayerDB, (client, message) => {
            const player = this.server.state.players.get(client.sessionId);
            if (!player) return;
            player.playerDB = message;
        });

        this.server.onMessage(sEventArg.Teleport, (client, message:any) => {
            const data = {
                OwnerSessionId: client.sessionId,
                ZoneType: message.ZoneType,
            }
            this.server.broadcast(sEventArg.Teleport, data);
        });

        this.server.onMessage(sEventArg.LeaderBoard_Update, (_client, message: any) => {
            this.server.broadcast(sEventArg.LeaderBoard_Update, message);
        });

        /** Wonder **/
        this.server.onMessage(MESSAGE.MissionClear, (client, message:any) => {
            const player = this.server.state.players.get(client.sessionId);
            if(!player) return;

            if(message.Type == MissionType.JG) {
                player.wonderWorldData.MissionClear_JG = true;

            } else if(message.Type == MissionType.NT) {
                player.wonderWorldData.MissionClear_NT = true;
            }
        });

        this.server.onMessage(MESSAGE.AddBadge, (client, message:any) => {
            const player = this.server.state.players.get(client.sessionId);
            if(!player) return;
            player.wonderWorldData.MissionClear_Badge = true;
        });

        this.server.onMessage(MESSAGE.MissionAllClear, (client, message:any) => {
            const player = this.server.state.players.get(client.sessionId);
            if(!player) return;
            player.wonderWorldData.MissionClear_JG = true;
            player.wonderWorldData.MissionClear_NT = true;
            player.wonderWorldData.MissionClear_Badge = true;
        });

        this.server.onMessage(MESSAGE.SetWonder, (client, message:any) => {
            const player = this.server.state.players.get(client.sessionId);
            if (player) {
                player.wonder.CurrentZone = message.CurrentZone;
                player.wonder.Multiplay = message.Multiplay;
            }
        });

        this.server.onMessage(MESSAGE.Leaderboard_Update, (client, message:any) => {
            this.server.broadcast(MESSAGE.Leaderboard_Update, message);
        });
        
        // Pose
        this.server.onMessage(MESSAGE.Pose, (client, message:any) => {
            const data = {
                OwnerSessionId: client.sessionId,
                Name: message.Name,
                Type: message.Type,
                isPlay: message.isPlay,
            }
            console.log(JSON.stringify(data));
            this.server.broadcast(MESSAGE.Pose, data);
        });
        
        // Picnic
        this.server.onMessage(MESSAGE.Picnic, (client, message:any) => {
            const data = {
                OwnerSessionId: client.sessionId,
                Name: message.Name,
                Type: message.Type,
                isPlay: message.isPlay,
            }
            this.server.broadcast(MESSAGE.Picnic, data);
        });
        
        // Photo Pose
        this.server.onMessage(MESSAGE.PhotoPose, (client, message:any) => {
            const data = {
                OwnerSessionId: client.sessionId,
                isHasPoint: message.isHasPoint,
                Name: message.Name,
                WonderState: message.WonderState,
                isPlay: message.isPlay,
            }
            this.server.broadcast(MESSAGE.PhotoPose, data);
        });

        // Balloon
        this.server.onMessage(MESSAGE.Balloon_Play, (client, message:any) => {
            if(this.balloonState && message.isPlay) return;
            this.balloonState = message.isPlay;
            this.server.broadcast(MESSAGE.Balloon_Play, message);
        });

        this.server.onMessage(MESSAGE.Balloon_Ride, (client, message:any) => {
            const syncRide = {
                OwnerSessionId:client.sessionId,
                isRide: message.isRide,
            }
            this.server.broadcast(MESSAGE.Balloon_Ride, syncRide);
        });

        this.server.onMessage(MESSAGE.Balloon_Ride_OFF, (client, message:any) => {
            const syncRide = {
                OwnerSessionId: client.sessionId,
                isRide: false,
            };
            this.server.broadcast(MESSAGE.Balloon_Ride, syncRide);
        });

        this.server.onMessage(MESSAGE.Play_GameZone, (client, message:any) => {
            const data = {
                OwnerSessionId: client.sessionId,
                machineType: message.Type,
                isPlay: message.isPlay,
            };
            this.server.broadcast(MESSAGE.Play_GameZone, data);
        });

        this.server.onMessage(MESSAGE.Play_Score, (client, message:number) => {
            const player = this.server.state.players.get(client.sessionId);
            if(!player) return;

            player.wonderWorldData.playScore = message as number;
        });

        this.server.onMessage(MESSAGE.State_OFF, (client, message:any) => {
            const State_OFF = {
                OwnerSessionId: client.sessionId,
                isRide: false,
            };
            this.server.broadcast(message.MESSAGE, State_OFF);
        });

        this.server.onMessage(MESSAGE.ChairSit, (client: SandboxPlayer, message) => {
            const chairMsg :syncChair = {
                chairId : message.chairId,
                OwnerSessionId : client.sessionId,
                onOff: !message.isSit,
            };
            const msg = message.isSit ? MESSAGE.ChairSitDown : MESSAGE.ChairSitUp;
            this.server.broadcast(msg, chairMsg);
            // this.broadcast(msg, chairMsg, {except: client});
            // client.send(msg, chairMsg);
        });
        
        this.server.onMessage(MESSAGE.Equip, (client: SandboxPlayer, message) => {            
            const equipData:EquipData = new EquipData();
            equipData.sessionId = client.sessionId;
            equipData.itemName = message.Name;
            equipData.bone = message.Attach;
            equipData.wonderState = message.WonderState;
            equipData.key = `${client.sessionId}_${equipData.bone}`;
            equipData.prevItemName = "";
            equipData.prevBone = -1;
            
            console.log(`${MESSAGE.Equip} : ${equipData.key} ${equipData.itemName}`);

            if (this.server.state.equipDatas.has(equipData.key)) {
                const prevData = this.server.state.equipDatas.get(equipData.key);
                if (prevData && prevData.sessionId === client.sessionId) {
                    equipData.prevItemName = prevData.itemName;
                    equipData.prevBone = prevData.bone;                    
                }
            }
            this.server.state.equipDatas.set(equipData.key, equipData);
            this.server.broadcast(MESSAGE.Equip, equipData);
        });
        
        this.server.onMessage(MESSAGE.Unequip, (client: SandboxPlayer, message) => {
            const equipData: EquipData = new EquipData();
            equipData.sessionId = client.sessionId;
            equipData.itemName = message.Name;
            equipData.bone = message.Attach;
            equipData.wonderState = message.WonderState;
            equipData.key = `${client.sessionId}_${equipData.bone}`;
            console.log(`${MESSAGE.Unequip} : ${equipData.key} ${equipData.itemName}`);
            
            if(this.server.state.equipDatas.has(equipData.key)) this.server.state.equipDatas.delete(equipData.key);
            console.log(`${equipData.bone} : ${equipData.prevBone}`)
            console.log(`${equipData.itemName} : ${equipData.prevItemName}`)
            this.server.broadcast(MESSAGE.Unequip, equipData);
        });

        this.server.onMessage(MESSAGE.TourState, (client, message: any) => {
            this.tourState = message.IsTour;

            const tourData: TourData = {
                OwnerSessionId: client.sessionId,
                IsTour: this.tourState
            }
            
            this.server.broadcast(MESSAGE.TourState, tourData);
        });

        this.server.onMessage(MESSAGE.InstantiatedEquip, (client, message) => {
            this.equipMap.forEach((equipData : PlayerEquip, sessionId : string) => {
                if(equipData.Head.IsEquip) client.send(MESSAGE.EquipItem, {
                    SessionId : sessionId,
                    Bone : 10,
                    ItemIndex : equipData.Head.Index
                });
                if(equipData.Neck.IsEquip) client.send(MESSAGE.EquipItem, {
                    SessionId : sessionId,
                    Bone : 9,
                    ItemIndex : equipData.Neck.Index
                });
                if(equipData.RightHand.IsEquip) client.send(MESSAGE.EquipItem, {
                    SessionId : sessionId,
                    Bone : 18,
                    ItemIndex : equipData.RightHand.Index
                });
            });
        });

        this.server.onMessage(MESSAGE.EquipItem, (client, message) => {
            const bone = message.bone;
            const itemIndex = message.itemIndex;

            const data = {
                SessionId : client.sessionId,
                Bone : bone,
                ItemIndex : itemIndex,
            }

            const equip = this.equipMap.get(client.sessionId);
            if(equip) {
                switch(bone) {
                    case 10:    // head
                        if(equip.Head.IsEquip) this.server.broadcast(MESSAGE.UnequipItem, { SessionId : client.sessionId, Bone : bone });
                        equip.Head.Index = itemIndex;
                        equip.Head.IsEquip = true;
                        break;
                    case 9:     // neck
                        if(equip.Neck.IsEquip) this.server.broadcast(MESSAGE.UnequipItem, { SessionId : client.sessionId, Bone : bone });
                        equip.Neck.Index = itemIndex;
                        equip.Neck.IsEquip = true;
                        break;
                    case 18:    // right hand
                        if(equip.RightHand.IsEquip) this.server.broadcast(MESSAGE.UnequipItem, { SessionId : client.sessionId, Bone : bone });
                        equip.RightHand.Index = itemIndex;
                        equip.RightHand.IsEquip = true;
                        break;
                }
                this.server.broadcast(MESSAGE.EquipItem, data);
            }
        });

        this.server.onMessage(MESSAGE.UnequipItem, (client, message) => {
            const equip = this.equipMap.get(client.sessionId);
            const bone = message.bone;

            if(equip) {
                switch(bone) {
                    case 10:    // head
                        equip.Head.Index = -1;
                        equip.Head.IsEquip = false;
                        break;
                    case 9:     // neck
                        equip.Neck.Index = -1;
                        equip.Neck.IsEquip = false;
                        break;
                    case 18:    // right hand
                        equip.RightHand.Index = -1;
                        equip.RightHand.IsEquip = false;
                        break;
                }
            }

            this.server.broadcast(MESSAGE.UnequipItem, { SessionId : client.sessionId, Bone : bone });
        });

        this.server.onMessage(MESSAGE.VisibleItem, (client, message) => {
            const equip = this.equipMap.get(client.sessionId);
            const bone = message.bone;
            let isEquip : boolean = false;

            if(equip) {
                switch(bone) {
                    case 10:
                        isEquip = equip.Head.IsEquip;
                        break;
                    case 9:
                        isEquip = equip.Neck.IsEquip;
                        break;
                    case 18:
                        isEquip = equip.RightHand.IsEquip;
                        break;
                }
            }

            if(isEquip) this.server.broadcast(MESSAGE.VisibleItem, { SessionId : client.sessionId, Bone :  bone});
        });

        this.server.onMessage(MESSAGE.InvisibleItem, (client, message) => {
            const equip = this.equipMap.get(client.sessionId);
            const bone = message.bone;
            let isEquip : boolean = false;

            if(equip) {
                switch(bone) {
                    case 10:
                        isEquip = equip.Head.IsEquip;
                        break;
                    case 9:
                        isEquip = equip.Neck.IsEquip;
                        break;
                    case 18:
                        isEquip = equip.RightHand.IsEquip;
                        break;
                }
            }

            if(isEquip) this.server.broadcast(MESSAGE.InvisibleItem, { SessionId : client.sessionId, Bone :  bone});
        });
    }

    async OnJoin(client: SandboxPlayer) {
        if(!this.sessionIdQueue.includes(client.sessionId)) {
            this.sessionIdQueue.push(client.sessionId.toString());
        }
        this.equipMap.set(client.sessionId, {
            Head : { Index : -1, IsEquip : false },
            RightHand : { Index : -1, IsEquip : false },
            Neck : { Index : -1, IsEquip : false }
        });
    }
    
    async OnJoined(client: SandboxPlayer) {
        /* get player */
        const players = this.server.state.players;
        const player = players.get(client.sessionId);

        /* load storage */
        const storage: DataStorage = client.loadDataStorage();

        /* Visit Count */
        // let visit_cnt = await storage.get(StorageName.VisitCount) as number;
        // if (visit_cnt == null) visit_cnt = 0;
        // console.log(`[OnJoin] ${client.sessionId}'s visiting count : ${visit_cnt}`);
        // player.visit = visit_cnt;
        // await storage.set(StorageName.VisitCount, ++visit_cnt);

        /* 임시 */
        // let worldData = await storage.get(StorageName.WorldData) as number;
        // await storage.set(StorageName.WorldData, ++worldData);
        /* World Data */
        // Find Data
        let JSON_data = await storage.get(StorageName.WorldData) as string;
        console.log(`[Storage] ${StorageName.WorldData} loaded... ${JSON_data}`);
        const isNotFound = JSON_data == null || JSON_data == undefined;

        // Processing Data
        if (isNotFound) JSON_data = this.CompressWorldData(client.sessionId, true);
        else this.ParseWorldData(client.sessionId, JSON_data);

        // Save Data
        console.log(`[OnJoin] ${client.sessionId}'s Wonder World Data : ${JSON_data}`);
        await storage.set(StorageName.WorldData, JSON_data);

        let worldVisitCount = await storage.get("visit") as string;

        if(!worldVisitCount) {
            worldVisitCount = JSON.stringify({count: 0});
        }

        const visit = JSON.parse(worldVisitCount);
        visit.count += 1;
        console.log(JSON.stringify(visit));

        await storage.set("visit", JSON.stringify(visit));

        /* onJoined End */
        this.server.state.players.set(client.sessionId, player);
    }

    async OnLeave(client: SandboxPlayer) {
        if(this.equipMap.has(client.sessionId)) this.equipMap.delete(client.sessionId);
        const player = this.server.state.players.get(client.sessionId);
        if(player) {
            if(!player.wonderWorldData.MissionClear_Badge) {
                const addBadge = player.wonderWorldData.MissionClear_JG && player.wonderWorldData.MissionClear_NT;
                if(addBadge) player.wonderWorldData.MissionClear_Badge = addBadge;
                console.log(`[OnLeave] Complete Compress Mission Data.... ${player.wonderWorldData.MissionClear_Badge}`);
            }
        }

        /*** Http Data Connection Service ***/
        this.SendRequest_POST(client, HttpData.POST_URL, player.playerDB);

        /* Wonder World Data */
        const JSON_data = this.CompressWorldData(client.sessionId);
        console.log(`[OnLeave] ${StorageName.WorldData} saved... ${JSON_data}`);
        console.log(`[onLeave] ${client.sessionId}'s Player World Data : ${JSON_data}`)
        await client.loadDataStorage().set(StorageName.WorldData, JSON_data);
        
        if(this.sessionIdQueue.includes(client.sessionId)) {
            const leavePlayerIndex = this.sessionIdQueue.indexOf(client.sessionId);
            this.sessionIdQueue.splice(leavePlayerIndex, 1);
            if (leavePlayerIndex == 0) {
                console.log(`master->, ${this.sessionIdQueue[0]}`);
                this.server.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
            }
        }
    }

    OnTick(deltaTime: number) {
    }
    
    /** Wonder World Data **/
    /* Push Data */
    private CompressWorldData(sessionId:string, isInit:boolean = false) {
        /* get player */
        const players = this.server.state.players;
        const player = players.get(sessionId);

        /* Set Player Data */
        if(isInit) {
            // player.visit = 1;
            player.wonderWorldData.playScore = 0;
            player.wonderWorldData.MissionClear_JG = false;
            player.wonderWorldData.MissionClear_NT = false;
            player.wonderWorldData.MissionClear_Badge = false;
        }
        
        const worldData:WorldData = {
            // visitCount: player.visit,
            playScore: player.wonderWorldData.playScore,
            MissionClear_JG: player.wonderWorldData.MissionClear_JG,
            MissionClear_NT: player.wonderWorldData.MissionClear_NT,
            MissionClear_Badge: player.wonderWorldData.MissionClear_Badge,
        }

        return JSON.stringify(worldData);
    }

    /* Parse and Get Data */
    private ParseWorldData(sessionId:string, json_date:string) {
        /* get player */
        const players = this.server.state.players;
        const player = players.get(sessionId);

        const worldData:WorldData = JSON.parse(json_date) as WorldData;
        
        /* Set Player Data */
        // player.visit = (worldData.visitCount as number) +1;
        player.wonderWorldData.playScore = worldData.playScore as number;
        player.wonderWorldData.MissionClear_JG = worldData.MissionClear_JG as boolean;
        player.wonderWorldData.MissionClear_NT = worldData.MissionClear_NT as boolean;
        player.wonderWorldData.MissionClear_Badge = worldData.MissionClear_Badge as boolean;
    }




    /*** Http Data Connection Service ***/
    private SendRequest_GET(client:SandboxPlayer, url:string) {
        const response = HttpService.getAsync(url);
        response.then((httpResponse) => {
            const jsonData = JSON.parse(httpResponse.response);
            console.log(`[HttpService] GET : ${httpResponse.statusCode}: ${httpResponse.statusText} \n\n${httpResponse.response}`);
            const data = {
                type: HttpData.GET,
                hasData: !(Object.keys(jsonData.body).length === 0),
                body: jsonData.body,
            }
            client.send(MESSAGE.HTTP, data);
        });
    }
    private SendRequest_POST(client:SandboxPlayer, url:string, data:string) {
        const response = HttpService.postAsync(url, data);
        response.then((httpResponse) => {            
            console.log(`[HttpService] POST : ${httpResponse.statusCode}: ${httpResponse.statusText} \n\n${httpResponse.response}`);
            // client.send(HttpData.POST, true);
        });
    }
}

interface syncTween {
    Id: string,
    position: sVector3,
    nextIndex: number,
    loopCount: number,
    sendTime: number,
}

interface SyncAnimator {
    Id: string,
    clipNameHash: number,
    clipNormalizedTime: number,
}

interface InstantiateObj{
    Id:string;
    prefabName:string;
    ownerSessionId?:string;
    spawnPosition?:sVector3;
    spawnRotation?:sQuaternion;
}

/* Chair */
interface syncChair {
    chairId: string,
    OwnerSessionId: string,
    onOff: boolean,
}

export enum MESSAGE {
    /*** Http Data Connection Service ***/
    HTTP = "HTTP",
    PlayerDB = "PlayerDB",
    Teleport = "Teleport",

    SyncPlayer = "SyncPlayer",
    SyncTransform = "SyncTransform",
    SyncTransformStatus = "SyncTransformStatus",
    SyncAnimator = "SyncAnimator",
    ResponseAnimator = "ResponseAnimator",
    ChangeOwner = "ChangeOwner",
    Instantiate = "Instantiate",
    RequestInstantiateCache = "RequestInstantiateCache",
    ResponsePosition = "ResponsePosition",
    SyncDOTween = "SyncDOTween",
    CheckServerTimeRequest = "CheckServerTimeRequest",
    CheckServerTimeResponse = "CheckServerTimeResponse",
    CheckMaster = "CheckMaster",
    MasterResponse = "MasterResponse",
    PauseUser = "PauseUser",
    UnPauseUser = "UnPauseUser",
    
    ChairSit = "ChairSit",
    ChairSitDown = "ChairSitDown",
    ChairSitUp = "ChairSitUp",
    Equip = "Equip",
    EquipChange = "EquipChange",
    Unequip = "Unequip",
    SyncObjectAnimation = "SyncObjectAnimation",
    LOG = "Log",
    Visible = "Visible",
    Leaderboard_Update = "Leaderboard_Update",

    /** Wonder **/
    /* Wonder Zone */
    AddBadge = "AddBadge",
    MissionClear = "MissionClear",
    MissionAllClear = "MissionAllClear",
    SetWonder = "SetWonder",
    State_OFF = "State_OFF",
    TeleportZone = "TeleportZone",
    Picnic = "Picnic",
    PhotoPose = "PhotoPose",
    Balloon_Play = "Balloon_Play",
    Balloon_Ride = "Balloon_Ride",
    Balloon_Ride_OFF = "Balloon_Ride_OFF",
    Bumper_Play = "Bumper_Play",
    Bumper_Ride = "Bumper_Ride",
    Bumper_Ride_OFF = "Bumper_Ride_OFF",
    Play_GameZone = "Play_GameZone",
    Play_Score = "Play_Score",

    /* Horror Zone */

    Pose = "Pose",
    LoadData = "LoadData",
    TourState = "TourState",

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
    InvisibleItem = "InvisibleItem",
}

interface PlayerEquip {
    Head : Equip,
    RightHand : Equip,
    Neck : Equip,
}

interface Equip {
    Index : number,
    IsEquip : boolean,
}

/*** Http Data Connection Service ***/
enum HttpData {
    GET = "GET",
    POST = "POST",
    GET_URL = "https://bkol779o38.execute-api.ap-northeast-2.amazonaws.com/WonderLandAPI/userdata/",
    POST_URL = "https://bkol779o38.execute-api.ap-northeast-2.amazonaws.com/WonderLandAPI/userdata",
    Data_Version = "0.9.0",
}

/** Wonder **/
enum StorageName {
    VisitCount = "VisitCount",
    PlayerData = "PlayerData",
    WorldData = "WonderWorldData_0.8.0",
}

/** Wonder **/
interface WorldData {
    playScore: number,
    // visitCount: number,
    MissionClear_JG: boolean,
    MissionClear_NT: boolean,
    MissionClear_Badge: boolean,
}

interface TourData {
    OwnerSessionId: string;
    IsTour: boolean;
}

enum MissionType {
    NONE = "NONE",
    JG = "JG", NT = "NT",
    Stage = "Stage", Runway = "Runway",
}