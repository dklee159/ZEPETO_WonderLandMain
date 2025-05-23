import { CanvasGroup, Color, Material, Transform, Vector3 } from "UnityEngine";
import { Image, ScrollRect } from "UnityEngine.UI";
import ZTweenComponent from "./ZTweenComponent";
import ZTweenManager from "./ZTweenManager";
import ZTweener from "./ZTweener";

export default class ZTween {
    public static instance: ZTweenComponent = null;
    private static initialized: boolean = false;

    public static Init() {
        if (ZTween.initialized) return;

        ZTween.initialized = true;
        ZTweenComponent.Create();
    }

    private static InitCheck() {
        if (ZTween.initialized) return;

        ZTween.Init();
    }

    public static To<T>(getter:() => T, setter:(v:T) => void, endValue:T, duration: number):ZTweener {
        ZTween.InitCheck();
        const t = ZTweenManager.GetTweener();
        t.SetUp(getter, setter, endValue, duration);
        return t;
    }

    public static TransfomMoveTo(transform: Transform, endValue: Vector3, duration: number): ZTweener {
        return ZTween.To(
            () => transform.position,
            (v: Vector3) => {
                transform.position = v;
            },
            endValue, duration);
    }

    public static VectorMoveTo(pos: Vector3, endValue: Vector3, duration: number): ZTweener {
        return ZTween.To(
            () => pos,
            (v: Vector3) => {
                pos = v;
            },
            endValue, duration);
    }


    public static TransfomLocalMoveTo(transform: Transform, endValue: Vector3, duration: number): ZTweener {
        return ZTween.To(
            () => transform.localPosition,
            (v: Vector3) => {
                transform.localPosition = v;
            },
            endValue, duration);
    }

    public static TransfomLocalScaleTo(transform: Transform, endValue: Vector3, duration: number): ZTweener {
        return ZTween.To(
            () => transform.localScale,
            (v: Vector3) => {
                transform.localScale = v;
            },
            endValue, duration);
    }

    public static ScrollRectHorizontalNormalizedPositionTo(scrollRect: ScrollRect, endValue: number, duration: number): ZTweener {
        return ZTween.To(
            () => scrollRect.horizontalNormalizedPosition,
            (v: number) => {
                scrollRect.horizontalNormalizedPosition = v;
            },
            endValue, duration);
    }

    public static ScrollRectVerticalNormalizedPositionTo(scrollRect: ScrollRect, endValue: number, duration: number): ZTweener {
        return ZTween.To(
            () => scrollRect.verticalNormalizedPosition,
            (v: number) => {
                scrollRect.verticalNormalizedPosition = v;
            },
            endValue, duration);
    }

    public static MaterialColorTo(material: Material, endValue: Color, duration: number): ZTweener {
        return ZTween.To(
            () => material.color,
            (v: Color) => {
                material.color = v;
            },
            endValue, duration);
    }

    public static ImageColorTo(image: Image, endValue: Color, duration: number): ZTweener {
        return ZTween.To(
            () => image.color,
            (v: Color) => {
                image.color = v;
            },
            endValue, duration);
    }

    public static CanvasGroupAlphaTo(canvasGroup: CanvasGroup, endValue: number, duration: number): ZTweener {
        return ZTween.To(
            () => canvasGroup.alpha,
            (v: number) => {
                canvasGroup.alpha = v;
            },
            endValue, duration);
    }
}