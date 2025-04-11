import { Application, Resources, SystemLanguage, TextAsset } from "UnityEngine";
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export enum LanguageType
{
    None = -1,
    Kr = 1,
    En = 2,
    Jp = 3,
    ChS = 4,
    ChT = 5,
    Th = 6,
    In = 7,
    Vn = 8,
    Fr = 9,
}

export default class TranslateManager extends ZepetoScriptBehaviour {
    private static nowLanguage:LanguageType = LanguageType.None;
    private static textDB:Array<TranslateStringData>  = new Array<TranslateStringData>();
    
    public static reformat(a:string, ...arg:string[] ):string 
    {
        var formatted = a;
        for(let i=0;i<arg.length;i++)
        {
            formatted = formatted.replace("{" + i + "}", arg[i]);
        }
        return formatted;
    };

    public static get nowSystemLanguage():LanguageType
    {
        /* Backdoor */
        // if(GameManager.instance.editLanguage) return GameManager.instance.editLanguageType;

        if(this.nowLanguage = LanguageType.None)
        {
            switch(Application.systemLanguage)
            {
                
                case SystemLanguage.Korean:
                    this.nowLanguage = LanguageType.Kr;
                    break;
                case SystemLanguage.English:
                    this.nowLanguage = LanguageType.En;
                    break;
                case SystemLanguage.Chinese:
                    this.nowLanguage = LanguageType.ChS;
                    break;
                case SystemLanguage.ChineseSimplified:
                    this.nowLanguage = LanguageType.ChS;
                    break;
                case SystemLanguage.ChineseTraditional:
                    this.nowLanguage = LanguageType.ChT;
                    break;
                case SystemLanguage.Japanese:
                    this.nowLanguage = LanguageType.Jp;
                    break;
                case SystemLanguage.Thai:
                    this.nowLanguage = LanguageType.Th;
                    break;
                case SystemLanguage.Vietnamese:
                    this.nowLanguage = LanguageType.Vn;
                    break;
                case SystemLanguage.French:
                    this.nowLanguage = LanguageType.Fr;
                    break;
                case SystemLanguage.Indonesian:
                    this.nowLanguage = LanguageType.In;
                    break;
                default : 
                    this.nowLanguage = LanguageType.En;
                    break;
                
            }
        }
        return this.nowLanguage;
    }

    private static get InitTextDB():Array<TranslateStringData>
    {
        if(this.textDB.length<1)
        {
            let textDBText:TextAsset = Resources.Load<TextAsset>("kw_translate_all");
            this.InputTextData(textDBText);
        }
        return this.textDB;
    }

    private static InputTextData(csvData:TextAsset)
    {
        let textAsset:TextAsset  = csvData;
        if (textAsset == null)
            return;
        
        
        let textAssetStr:string  = textAsset.text;
        let strSplitLine:Array<string> = textAssetStr.split('\n');

        for (let i=0; i<strSplitLine.length; ++i) {

            while(strSplitLine[i].includes("<br>")) {
                strSplitLine[i] = strSplitLine[i].replace("<br>",'\n');
            }

            const nowLineStr:string[] = strSplitLine[i].split(',');
            const test:string[] = [];
            // let signOrder:number = 0;

            for (let j=0; j<nowLineStr.length; ++j) {

                let sumStr:string;
                const tstr = nowLineStr[j].trim();

                if (tstr[0] == '"' && tstr[tstr.length -1] == '"') {
                    const pattern = /"/g;
                    const replacement = ``;
                    sumStr = nowLineStr[j].replace(pattern, replacement);
                }
                else {

                    if (nowLineStr[j].includes('"'))//.Contains("\""))
                    {
                        sumStr = nowLineStr[j];

                        for (j = j + 1; j < nowLineStr.length; ++j) {
                            sumStr += nowLineStr[j];
                            if (nowLineStr[j].includes('"')) {
                                break;
                            }
                        }

                        //sumStr = sumStr.split('"')[1];

                        let kk = sumStr.split('"');
                        sumStr = kk[1];


                    }
                    else {
                        sumStr = nowLineStr[j];
                    }
                }
                test.push(sumStr);
            }


            this.textDB.push(this.SetTextData(test));
            //console.log(test);
        }
    }

    private static ParseDataWithText(csvData:TextAsset)
    {
        let nowString:boolean = false;
        let test:Array<string> = ['','','','','','','','','']
        let idx:number = 0;
        console.log(csvData.text.length);
        let x:number = csvData.text.length;
        let argu:string = '';
        for(let i:number=0; i<x;i++)
        {
            switch(csvData.text[i])
            {
                case '\n':
                
                    if(nowString == true)
                    {
                        test[idx] += csvData.text[i];
                    }
                    else
                    {
                        console.log(test);
                        this.textDB.push(this.SetTextData(test));
                        idx += 1;
                        test = ['','','','','','','','',''];
                        idx = 0;
                    }
                    break;
                case ',':
                    if(nowString == true)
                    {
                        test[idx] += csvData.text[i];
                    }
                    else
                    {
                        idx += 1;
                    }
                    break;
                case '"' :
                    if(nowString==false)
                    {
                        nowString = true;
                    }
                    else{
                        if(csvData.text[i+1] == '"')
                        {
                            test[idx] += csvData.text[i];
                            i=i+1;
                        }
                        else
                        {
                            nowString = false;
                        }
                    }
                    break;
                default:
                    test[idx] += csvData.text[i];
                    break;
            }
        }
    }

    private static SetTextData(stringData:Array<string>):TranslateStringData
    {
        var newTextData:TranslateStringData = new TranslateStringData();
        newTextData.stringData  = new Array<string>();
        newTextData.stringID = parseInt(stringData[0]);

        newTextData.stringData.push(stringData[LanguageType.Kr]);
        newTextData.stringData.push(stringData[LanguageType.En]);        
        newTextData.stringData.push(stringData[LanguageType.Jp]);
        newTextData.stringData.push(stringData[LanguageType.ChS]);
        newTextData.stringData.push(stringData[LanguageType.ChT]);
        newTextData.stringData.push(stringData[LanguageType.Th ]);
        newTextData.stringData.push(stringData[LanguageType.In ]);
        newTextData.stringData.push(stringData[LanguageType.Vn ]);
        newTextData.stringData.push(stringData[LanguageType.Fr ]);
        
        return newTextData;
    }

    public static GetText(idx:number):string
    {
        let stringdata:string;
        this.InitTextDB.forEach(ea=>{
            if(ea.stringID == idx)
            {
                stringdata = ea.stringData[this.nowSystemLanguage-1];
                // if(TranslateManager.nowLanguage == LanguageType.In){
                //     stringdata = stringdata.trim();
                // }
            }
        });
        if(stringdata == null){
            stringdata = '[텍스트가 존재하지 않습니다.] 사용된 인덱스: ' + idx;
        }
        return stringdata;
    }
}

export class TranslateStringData
{
    public stringID:number;
    public stringData:Array<string>;
}