import { CustomLoadingManager } from "managers/LoadingManager/LoadingManager";
import { BasicScene } from "scenes/BasicScene/BasicScene";
import { ChessScene } from "scenes/ChessScene/ChessScene";
import { ReinhardToneMapping, sRGBEncoding, WebGLRenderer } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GameOptions } from "./types";
export class Game {
  private width = window.innerWidth;
  private height = window.innerHeight;

  loadingManager: CustomLoadingManager;
  loader: GLTFLoader;
  renderer: WebGLRenderer;
  activeScene: BasicScene | null;

  options: GameOptions;

  resizeListener: () => void;

  constructor(options: GameOptions) {
    this.options = options;

    this.setupLoader();
    this.setupRenderer();

    this.addListenerOnResize(this.renderer);

    this.activeScene = new ChessScene({
      renderer: this.renderer,
      loader: this.loader,
      options: {
        addGridHelper: this.options.addGridHelper,
        lightHelpers: this.options.lightHelpers,
        cannonDebugger: this.options.cannonDebugger,
      },
    });
  }

  private setupLoader(): void {
    this.loadingManager = new CustomLoadingManager();
    this.loader = new GLTFLoader(this.loadingManager);
  }

  private setupRenderer(): void {
    this.renderer = new WebGLRenderer({
      canvas: document.getElementById("app") as HTMLCanvasElement,
      alpha: false,
      powerPreference: "high-performance",
    });

    this.renderer.setSize(this.width, this.height);

    this.renderer.toneMapping = ReinhardToneMapping;
    this.renderer.toneMappingExposure = 3;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
  }

  private addListenerOnResize(renderer: WebGLRenderer): void {
    this.resizeListener = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", this.resizeListener, false);
  }

  private addControlButton(): void {
    const div = document.createElement("DIV");
    const startBtn = document.createElement("BUTTON");
    startBtn.classList.add("btn");
    startBtn.innerHTML = "Start Game";

    startBtn.onclick = () => {
      this.activeScene.start();
      div.remove();
    };

    div.classList.add("game-buttons");
    div.appendChild(startBtn);

    document.body.appendChild(div);
  }

  init() {
    if (!this.activeScene) {
      throw Error("There is no active scene at the moment");
    }

    if (!this.activeScene.init) {
      throw Error("Every scene must be declaring init function");
    }

    this.activeScene.init();

    this.addControlButton();
  }

  update(): void {
    if (!this.activeScene) {
      throw Error("There is no active scene at the moment");
    }

    this.activeScene.world.fixedStep();
    this.activeScene.cannonDebugger?.update();
    this.activeScene.update();
  }

  cleanup(): void {
    window.removeEventListener("resize", this.resizeListener);
  }
}
