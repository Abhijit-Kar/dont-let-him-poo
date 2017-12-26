import { Injectable, EventEmitter } from "@angular/core";

import { Measurements, BREAKPOINTS, GAME_STATES } from "./choreographer.model";
import { GridService } from "../grid/grid.service";
import { Node, TILE_TYPES } from "../grid/grid.model";

import { UtilsService } from "../utils.service";
import { PathFindingService } from "../path-finding/path-finding.service";

@Injectable()
export class ChoreographerService {
  onGameStateChange: EventEmitter<GAME_STATES> = new EventEmitter<
    GAME_STATES
  >();
  onMeasurementsChange: EventEmitter<Measurements> = new EventEmitter<
    Measurements
  >();
  onPlayerPlaced: EventEmitter<Node> = new EventEmitter<Node>();
  onPathChange: EventEmitter<Node[]> = new EventEmitter<Node[]>();

  player: Node;
  private timer: any;
  private targets: Node[];
  private poo: Node;
  private crucialMeasurements: Measurements;
  public path: Node[];

  private _currentGameState: GAME_STATES = GAME_STATES.LOAD;
  get currentGameState(): GAME_STATES {
    return this._currentGameState;
  }
  set currentGameState(value: GAME_STATES) {
    this._currentGameState = value;
    this.onGameStateChange.emit(value);
  }

  constructor(
    private gridService: GridService,
    private utilsService: UtilsService,
    private pathFindingService: PathFindingService
  ) {
    this.gridService.onGridReady.subscribe($ => {
      this.currentGameState = GAME_STATES.START;
      this.cleverlyPlacePlayerLooAndPoo();
    });
  }

  private cleverlyPlacePlayerLooAndPoo() {
    this.targets = [];

    let playerPlaced: boolean;
    let looPlaced: boolean;
    let pooPlaced: boolean;
    let i, j, x, y, p, q;

    let count = 0;

    while (true) {
      console.log(`Tries: ${count++}`);

      if (!playerPlaced) {
        i = this.utilsService.getRandomNumber(0, 10);
        j = this.utilsService.getRandomNumber(0, 10);
      }
      if (!looPlaced) {
        x = this.utilsService.getRandomNumber(0, 10);
        y = this.utilsService.getRandomNumber(0, 10);
      }
      if (!pooPlaced) {
        p = this.utilsService.getRandomNumber(0, 10);
        q = this.utilsService.getRandomNumber(0, 10);
      }

      if (
        !playerPlaced &&
        this.gridService.gameGrid[i][j].tileType === TILE_TYPES.NONE
      ) {
        this.player = this.gridService.gameGrid[i][j];
        this.player.tileType = TILE_TYPES.PLAYER;
        playerPlaced = true;
      }

      if (
        !looPlaced &&
        this.gridService.gameGrid[x][y].tileType === TILE_TYPES.NONE
      ) {
        this.targets.push(this.gridService.gameGrid[x][y]);
        this.targets[this.targets.length - 1].tileType = TILE_TYPES.LOO;
        looPlaced = true;
      }

      if (
        !pooPlaced &&
        this.gridService.gameGrid[p][q].tileType === TILE_TYPES.NONE
      ) {
        this.poo = this.gridService.gameGrid[p][q];
        this.poo.tileType = TILE_TYPES.POOP;
        pooPlaced = true;
      }

      if (playerPlaced && looPlaced) {
        this.onPlayerPlaced.emit(this.player);
        this.path = this.pathFindingService.findPath(
          this.player,
          this.targets[this.targets.length - 1]
        );

        if (this.path && this.path.length > 5) {
          this.onPlayerPlaced.emit(this.player);
          this.onPathChange.emit(this.path);
          return;
        }

        playerPlaced = false;
      }
    }
  }

  generatePoo() {
    let pooPlaced: boolean;
    let p, q;

    let count = 0;

    while (!pooPlaced) {
      console.log(`Poo Tries: ${count++}`);

      p = this.utilsService.getRandomNumber(0, 10);
      q = this.utilsService.getRandomNumber(0, 10);

      if (
        !pooPlaced &&
        this.gridService.gameGrid[p][q].tileType === TILE_TYPES.NONE
      ) {
        this.poo = this.gridService.gameGrid[p][q];
        this.poo.tileType = TILE_TYPES.POOP;

        const path = this.pathFindingService.findPath(this.player, this.poo);

        if (path && path.length > 5) {
          pooPlaced = true;
        }
      }
    }
  }

  distractionPlaced(target: Node) {
    this.targets.push(target);

    this.path = this.pathFindingService.findPath(
      this.player,
      this.targets[this.targets.length - 1]
    );
    this.onPathChange.emit(this.path);
  }

  distractionOver(target: Node) {
    if (this.targets.length < 0) {
      return;
    }

    const index = this.targets.indexOf(target);
    if (index === -1) {
      return;
    }

    this.targets.splice(index, 1);

    this.path = this.pathFindingService.findPath(
      this.player,
      this.targets[this.targets.length - 1]
    );
    this.onPathChange.emit(this.path);
  }

  takeMeasurements(token: number) {
    switch (token) {
      case BREAKPOINTS.DESKTOP:
        this.crucialMeasurements = {
          cellSize: 37,
          cellMargin: 4,
          gridContainerPadding: 20
        };
        break;
      case BREAKPOINTS.MOBILE:
        this.crucialMeasurements = {
          cellSize: 24,
          cellMargin: 2,
          gridContainerPadding: 9
        };
        break;
    }

    this.onMeasurementsChange.emit(this.crucialMeasurements);
  }

  checkPathCollision(roadBlock: Node) {
    clearInterval(this.timer);
    if (!this.path) {
      return;
    }

    const path = this.pathFindingService.findPath(
      this.player,
      this.targets[this.targets.length - 1]
    );

    if (this.path.indexOf(roadBlock) !== -1 || path.length < this.path.length) {
      this.path = path;
      if (this.path) {
        this.onPathChange.emit(this.path);
      }
    }
  }
}