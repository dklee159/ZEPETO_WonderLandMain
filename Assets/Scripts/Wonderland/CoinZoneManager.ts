// import { Coroutine, Mathf, ParticleSystem, Random, Transform, WaitForSeconds } from 'UnityEngine'
// import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
// // import GameManager from '../Managers/GameManager';
// import { CoinData, ERROR } from '../Managers/TypeManager';
// import CoinController from './CoinController';
// import DataManager from '../../../Scripts/Manager/DataManager';

// export default class CoinZoneManager extends ZepetoScriptBehaviour {

//     /* Properties */
//     @SerializeField() private stayMin: number = 30;
//     @SerializeField() private stayMax: number = 45;
//     private coinDatas: CoinData[] = [];
//     private locations: Transform[] = [];
//     private prevIndexs: number[] = [];
//     private wait: WaitForSeconds;

//     private get stayTime(): number { return Mathf.Floor(Random.Range(this.stayMin, this.stayMax)); }
//     private get index() : number {
//         const index = Mathf.Floor(Random.Range(0, this.locations.length));
//         let found = false;
//         for(let i=0; i<this.prevIndexs.length; i++) {
//             if(this.prevIndexs[i] < 0) {
//                 this.prevIndexs[i] = index;
//                 return index;

//             } else if(this.prevIndexs[i] == index) {
//                 found = true;
//                 break;
//             }
//         }
        
//         if(!found) {
//             this.prevIndexs.splice(0, 1);
//             this.prevIndexs.push(index);
//             return index;
//         }
//         return this.index;
//     }


//     /* GameManager */
//     public RemoteStart() {
//         const positions = this.transform.GetChild(0);
//         const coinGroup = this.transform.GetChild(1);
//         const effectGroup = this.transform.GetChild(2);

//         // Index System
//         if(this.stayMax <= this.stayMin) this.stayMax = this.stayMin +5;
//         for(let i=0; i<coinGroup.childCount *2; i++) this.prevIndexs.push(-1);

//         // Location Processing
//         for(let i=0; i<positions.childCount; i++) {
//             const location = positions.GetChild(i);
//             this.locations.push(location);
//         }

//         // Coin Processing
//         if(coinGroup.childCount != effectGroup.childCount) return console.error(ERROR.NOT_MATCHED);
//         for(let i=0; i<coinGroup.childCount; i++) {
//             const coin = coinGroup.GetChild(i);
//             const effect = effectGroup.GetChild(i).GetComponent<ParticleSystem>();
//             const controller = coin.GetChild(0).GetComponent<CoinController>();
//             controller.RemoteStart(this, i);

//             const data:CoinData = {
//                 index: i,
//                 locationIndex: -1,
//                 coin: coin,
//                 controller: controller,
//                 effect: effect,
//                 move: null,
//             }
            
//             this.coinDatas.push(data);
//             this.CoinRandomMove(i, data.move);
//         }
//     }

//     /* Local Player Get Coin  */
//     public AddCoin(id:number) {
//         const data = this.coinDatas[id];
//         if(data.index != id) console.error(ERROR.NOT_MATCHED, data.index, id);
        
//         DataManager.Instance.AddCoin();

//         data.effect.transform.position = data.coin.GetChild(0).position;
//         data.effect.Play();

//         this.CoinRandomMove(id, data.move);
//     }

//     private CoinRandomMove(index:number, waitMove:Coroutine) {
//         if(waitMove) this.StopCoroutine(waitMove);
//         waitMove = this.StartCoroutine(this.WaitMove(index));
//     }

//     /* Wait Random Teleport Time */
//     private * WaitMove(index:number) {

//         // Locate
//         const data = this.coinDatas[index];
//         data.coin.position = this.locations[this.index].position;
        
//         // wait
//         if(!this.wait) this.wait = new WaitForSeconds(1);
//         for(let i=0; i<this.stayTime; i++) { yield this.wait; }

//         // END
//         yield this.wait;
//         this.CoinRandomMove(index, data.move);
//     }
// }