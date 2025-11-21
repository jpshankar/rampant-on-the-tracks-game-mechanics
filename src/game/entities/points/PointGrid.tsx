import GameMechanicsDemo from "@/game/scenes/GameMechanicsDemo";

import Point from "./Point";
import PointType from "./PointType";
import PointTypeOverride from "./PointTypeOverride";

export default class PointGrid extends Phaser.Physics.Arcade.Group {
    colsNum: number;
    rowsNum: number;

    sceneWidthInterval: number;
    sceneHeightInterval: number;

    pointGridOffset: number;

    constructor(world: Phaser.Physics.Arcade.World, scene: GameMechanicsDemo, colsNum: number, rowsNum: number, xyOffset: number, pointTypeOverrides: PointTypeOverride[]) {
        super(world, scene);

        const sceneWidth = Number(this.scene.game.config.width);
        const sceneHeight = Number(this.scene.game.config.height);

        this.colsNum = colsNum;
        this.rowsNum = rowsNum;

        this.pointGridOffset = xyOffset;

        this.sceneWidthInterval = sceneWidth / rowsNum;
        this.sceneHeightInterval = sceneHeight / colsNum;

        const colInds = Array.from({length: colsNum}, (_, index) => index);
        const colIndsByRow = Array.from({length: rowsNum}, (_) => colInds);

        colIndsByRow.forEach(
            (colInds, rowInd, _) => {
                const rowYCoord = (rowInd * this.sceneHeightInterval) + xyOffset;

                colInds.forEach(
                    (colInd) => {
                        const colXCoord = (colInd * this.sceneWidthInterval) + xyOffset;
                        const maybePointTypeOverride = pointTypeOverrides.find(({pointXy: pointColRow}) => colInd === pointColRow.x && rowInd === pointColRow.y);
                        
                        const pointType = maybePointTypeOverride?.pointType || PointType.Default;
                        const point = new Point(scene, colInd, rowInd, colXCoord, rowYCoord, pointType);

                        point.setInteractive();
                        // Change sites by clicking through until you get the right one.
                        point.on('pointerdown', () => {
                            switch (point.pointType) {
                                case PointType.Default:
                                    point.pointType = PointType.Block;
                                    point.setTexture("grid_point_blocked");
                                    break;
                                case PointType.Destination:
                                    // We shouldn't be able to change Destinations.
                                    break;
                                case PointType.Block:
                                    point.pointType = PointType.RedirectNorth;
                                    point.setTexture("grid_point_redirect_north");
                                    break;
                                case PointType.RedirectNorth:
                                    point.pointType = PointType.RedirectEast;
                                    point.setTexture("grid_point_redirect_east");
                                    break;
                                case PointType.RedirectEast:
                                    point.pointType = PointType.RedirectSouth;
                                    point.setTexture("grid_point_redirect_south");
                                    break;
                                case PointType.RedirectSouth:
                                    point.pointType = PointType.RedirectWest;
                                    point.setTexture("grid_point_redirect_west");
                                    break;
                                case PointType.RedirectWest:
                                    point.pointType = PointType.Default;
                                    point.setTexture("grid_point");
                                    break;
                            }
                        });

                        this.add(point);
                        this.scene.add.existing(point);
                    }
                );
            }
        );
    }   
}