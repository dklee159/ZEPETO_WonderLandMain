import {Sandbox, SandboxOptions, SandboxPlayer} from "ZEPETO.Multiplay";
import { Player } from "ZEPETO.Multiplay.Schema";
import { IModule } from "./ServerModule/IModule";
import SyncComponentModule from "./ServerModule/Modules/SyncComponentModule";
import SDModule from "./ServerModule/Modules/SDModule";

export default class extends Sandbox {

    private readonly _modules: IModule[] = [];
    private _isCreated: boolean = false;
    
    async onCreate(_options: SandboxOptions) {
        this._modules.push(new SyncComponentModule(this));
        this._modules.push(new SDModule(this));
        for (const module of this._modules) {
            await module.OnCreate();
        }
        this._isCreated = true;
    }

    async onJoin(client: SandboxPlayer) {
        for (const module of this._modules) {
            await module.OnJoin(client);
        }

        const player = new Player();
        player.sessionId = client.sessionId;
        if (client.userId) {
            player.zepetoUserId = client.userId;
        }
        this.state.players.set(client.sessionId, player);
        console.log(`join player, ${client.sessionId}`);
        
        for (const module of this._modules) {
            await module.OnJoined(client);
        }
    }
    

    async onLeave(client: SandboxPlayer, _consented?: boolean) {
        for (const module of this._modules) {
            await module.OnLeave(client);
        }
        this.state.players.delete(client.sessionId);

        console.log(`leave player, ${client.sessionId}`);
    }

    async onTick(deltaTime: number) {
        if (!this._isCreated) {
            return;
        }
        for (const module of this._modules) {
            module.OnTick(deltaTime);
        }
    }
}

