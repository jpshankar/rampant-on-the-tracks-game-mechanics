import GameMechanicsDemo from "@/game/scenes/GameMechanicsDemo";

import Point from "./Point";
import PointType from "./PointType";

export default class PointMap extends Phaser.GameObjects.Group {
    constructor(
        scene: GameMechanicsDemo, 
        pointTypeOverrides: Map<string, PointType>
    ) {
        super(scene);

        scene.verticesMap.forEach(
            (vertex, vertexId, _) => {
                const maybePointTypeOverride = pointTypeOverrides.get(vertexId)
                const pointType = maybePointTypeOverride || PointType.Default;

                const point = new Point(scene, vertex.x, vertex.y, vertexId, pointType);

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
                                    point.pointType = PointType.Redirect;
                                    point.setTexture("grid_point");

                                    const vertexNeighbors = Array.from(scene.neighborsMap.get(vertexId) || []);
                                    // Sorting by angles allows us to click through the Redirect possibilities in counterclockwise order.
                                    vertexNeighbors.sort(
                                        ({neighborPointAngleDegrees: vertex0AngleDegrees}, {neighborPointAngleDegrees: vertex1AngleDegrees}) => {
                                            return Math.abs(vertex0AngleDegrees - vertex1AngleDegrees);
                                        }
                                    );

                                    point.redirectionDestinations = vertexNeighbors;
                                    point.updateRedirectionLine(vertexNeighbors[0].neighborPointCoords)

                                    break;
                                case PointType.Redirect:
                                    point.redirectionDestinations.shift();

                                    if (point.redirectionDestinations.length > 0) {
                                        point.updateRedirectionLine(point.redirectionDestinations[0].neighborPointCoords);
                                    } else {
                                        point.pointType = PointType.Default;
                                        point.setTexture("grid_point");
                                        point.destroyRedirectionLineIfWasCreated();
                                    }
                                    break;
                            }
                        });

                        this.add(point);
                        this.scene.add.existing(point);
            }
        );
    }   
}