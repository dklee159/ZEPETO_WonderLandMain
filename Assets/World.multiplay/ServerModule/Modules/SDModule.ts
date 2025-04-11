import { SandboxPlayer } from 'ZEPETO.Multiplay';
// import { SyncSDCharacter } from 'ZEPETO.Multiplay.Schema';
import { MESSAGE } from './SyncComponentModule';
import { IModule } from '../IModule';

export default class SDModule extends IModule {
    private sdMap : Map<string, SDProp> = new Map<string, SDProp>();

    async OnCreate() {
        this.server.onMessage(MESSAGE.InstantiatedSD, (client, message) => {
            this.sdMap.forEach((sdProp : SDProp, sessionId : string) => {
                if(sdProp.Equip && client.sessionId !== sessionId) {
                    const data = {
                        SessionId : sessionId,
                        SDIndex : sdProp.SDIndex
                    }
                    client.send(MESSAGE.EquipSD, data);
                }
            });
        });
        this.server.onMessage(MESSAGE.EquipSD, (client, message) => {
            const sessionId = client.sessionId;
            const sdIndex = message.sdIndex;
            const data = {
                SessionId : sessionId,
                SDIndex : sdIndex,
            }

            this.sdMap.set(sessionId, {
                SessionId : sessionId,
                Equip : true,
                SDIndex : sdIndex
            });

            this.server.broadcast(MESSAGE.EquipSD, data);
        });
        this.server.onMessage(MESSAGE.UnequipSD, (client, message) => {
            const sessionId = client.sessionId;
            const sdIndex = message.sdIndex;
            const data = {
                SessionId : sessionId,
                SDIndex : sdIndex,
            }

            this.sdMap.set(sessionId, {
                SessionId : sessionId,
                Equip : false,
                SDIndex : -1
            })

            this.server.broadcast(MESSAGE.UnequipSD, data);
        });
        this.server.onMessage(MESSAGE.VisibleSD, (client, message) => {
            this.server.broadcast(MESSAGE.VisibleSD, client.sessionId);
        });
        this.server.onMessage(MESSAGE.InvisibleSD, (client, message) => {
            this.server.broadcast(MESSAGE.InvisibleSD, client.sessionId);
        });
    }
    async OnJoin(client: SandboxPlayer) {
        this.sdMap.set(client.sessionId, {SessionId : client.sessionId, Equip : false, SDIndex : -1});
    }
    async OnJoined(client: SandboxPlayer) {
    }
    async OnLeave(client: SandboxPlayer) {
        this.sdMap.delete(client.sessionId);
    }
    async OnTick(deltaTime: number) {
    }
}

interface SDProp {
    SessionId : string,
    Equip : boolean,
    SDIndex : number
}