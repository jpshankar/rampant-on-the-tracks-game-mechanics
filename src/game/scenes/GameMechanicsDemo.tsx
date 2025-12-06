import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

import PointData from '@/game/entities/points/PointData';
import PointMap from '@/game/entities/points/PointMap';
import PointType from '@/game/entities/points/PointType';

import RegionData from '@/game/entities/points/regions/RegionData';

import Walker from '@/game/entities/walker/Walker';
import PointNeighborData from '../entities/points/PointNeighborData';

const numWalkerSteps = 25;
const textStyle = {color: "black"};

// This specifies Destinations - it can also help specify unchangeable Redirects (PointGrid refactoring needed for actual unchangability.)
const pointTypeOverrides: Map<string, PointType> = new Map([
    ["6a1cd69c-c065-4b70-94d3-263902cc5fe8", PointType.Destination]
]);

const playerStartPointId = "edfd247f-8535-4909-92d8-98b9174f0348";

export default class GameMechanicsDemo extends Scene
{
    pointMap: PointMap;
    walker: Walker;

    verticesMap: Map<string, Phaser.Math.Vector2>;
    neighborsMap: Map<string, PointNeighborData[]> = new Map<string, PointNeighborData[]>();

    redirectsMap: Map<string, PointNeighborData> = new Map<string, PointNeighborData>();

    stepsText: Phaser.GameObjects.Text;
    destinationsText: Phaser.GameObjects.Text;

    destinatationsArrivedAt: number = 0;
    numDestinations: number;

    sceneWidth: number;
    sceneHeight: number;

    constructor () {
        super('GameMechanicsDemo');
    }

    preload() {
        this.load.setPath("assets");

        this.load.image("grid_point", "grid_point.png");
        this.load.image("grid_point_blocked", "grid_point_blocked.png");

        this.load.image("walker", "walker.png");
        this.load.image("walker_destination", "walker_destination.png");

        this.load.setPath("json");
        this.load.json("walker_map", "walker_map.json");
    }

    _makeIdCoordsMap(idCoordsEntries: [string, PointData][]): Map<string, Phaser.Math.Vector2> {
        const idCoordsData: [string, Phaser.Math.Vector2][] = idCoordsEntries.map(
            ([vertexId, {x, y}]) => {
                const scaledX = x * this.sceneWidth;
                const scaledY = y * this.sceneHeight;

                return [vertexId, new Phaser.Math.Vector2(scaledX, scaledY)];
            }
        )

        return new Map<string, Phaser.Math.Vector2>(idCoordsData);
    }

    _calculateNeighborPointAngleDegrees(pointNeighborDx: number, pointNeighborDy: number): number {
        const neighborPointAngleRadians = Math.atan2(pointNeighborDy, pointNeighborDx);
        const neighborPointAngleDegrees = (neighborPointAngleRadians * 180) / Math.PI;

        if (neighborPointAngleDegrees >= 0 && neighborPointAngleDegrees <= 90) {
            return Math.abs(90 - neighborPointAngleDegrees);
        } else if (neighborPointAngleDegrees >= 90 && neighborPointAngleDegrees <= 270) {
            return -(neighborPointAngleDegrees - 90);
        } else {
            return Math.abs(neighborPointAngleDegrees - 360) + 90;
        }
    }

    create() {
        this.sceneWidth = Number(this.game.config.width);
        this.sceneHeight = Number(this.game.config.height);
        
        const pointMapData = this.cache.json.get("walker_map");
        
        const verticesData = { ...pointMapData.boundaryVertices, ...pointMapData.diagramVertices };
        const verticesEntries: [string, PointData][] = Object.entries(verticesData);

        this.verticesMap = this._makeIdCoordsMap(verticesEntries);

        this.pointMap = new PointMap(this, pointTypeOverrides);

        const regionsData: RegionData[] = pointMapData.regions;

        const lineGraphics = this.add.graphics({ lineStyle: {width: 1, color: 0x000000 } });
        const linesSoFar: [string, string][] = [];
        
        for (const { edges } of regionsData) {
            for (const { vertexIdentifier0, vertexIdentifier1 } of edges) {
                const vertex0 = this.verticesMap.get(vertexIdentifier0);
                const vertex1 = this.verticesMap.get(vertexIdentifier1);

                if (vertex0 && vertex1) {
                    const identifier0Neighbors = this.neighborsMap.get(vertexIdentifier0);

                    const identifier1Dx = vertex1.x - vertex0.x;
                    const identifier1Dy = vertex1.y - vertex0.y;

                    const identifier1AsNeighbor: PointNeighborData = {
                        neighborPointId: vertexIdentifier1,
                        neighborPointCoords: vertex1,
                        neighborPointAngleDegrees: this._calculateNeighborPointAngleDegrees(identifier1Dx, identifier1Dy),
                        neighborDx: identifier1Dx,
                        neighborDy: identifier1Dy
                    }

                    if (identifier0Neighbors) {
                        const alreadyIdentifier0Neighbor =
                            identifier0Neighbors.find((identifier0Neighbor) => {
                                return identifier0Neighbor.neighborPointId === vertexIdentifier1;
                            });

                        if (!alreadyIdentifier0Neighbor) {
                            identifier0Neighbors.push(identifier1AsNeighbor);
                        }
                    } else {
                        this.neighborsMap.set(vertexIdentifier0, [identifier1AsNeighbor]);
                    }

                    const identifier1Neighbors = this.neighborsMap.get(vertexIdentifier1);
                    
                    const identifier0Dx = vertex0.x - vertex1.x;
                    const identifier0Dy = vertex0.y - vertex1.y;
                    
                    const identifier0AsNeighbor: PointNeighborData = {
                        neighborPointId: vertexIdentifier0,
                        neighborPointCoords: vertex0,
                        neighborPointAngleDegrees: this._calculateNeighborPointAngleDegrees(identifier0Dx, identifier0Dy),
                        neighborDx: identifier0Dx,
                        neighborDy: identifier0Dy
                    }

                    if (identifier1Neighbors) {
                        const alreadyIdentifier1Neighbor =
                            identifier1Neighbors.find((identifier1Neighbor) => {
                                return identifier1Neighbor.neighborPointId === vertexIdentifier0;
                            }); 

                        if (!alreadyIdentifier1Neighbor) {
                            identifier1Neighbors.push(identifier0AsNeighbor);
                        }
                    } else {
                        this.neighborsMap.set(vertexIdentifier1, [identifier0AsNeighbor]);
                    }

                    // Attempt to ensure that we don't draw lines connecting points more than once.
                    const lineAlreadyAdded = linesSoFar.find(
                        ([lineVertexId0, lineVertexId1]) => {
                            return (lineVertexId0 === vertexIdentifier0 && lineVertexId1 === vertexIdentifier1) || (lineVertexId1 === vertexIdentifier0 && lineVertexId0 === vertexIdentifier1);
                        }
                    )

                    if (!lineAlreadyAdded) {
                        const neighborLine = new Phaser.Geom.Line(vertex0.x, vertex0.y, vertex1.x, vertex1.y);
                        lineGraphics.strokeLineShape(neighborLine);
                        linesSoFar.push([vertexIdentifier0, vertexIdentifier1]);
                    } else {
                        console.log("found");
                    }
                } else {
                    console.log(`${vertexIdentifier0} and/or ${vertexIdentifier1} unexpectedly not found in ${this.verticesMap}`)
                }
            }
        }

        const walkerStartCoords = this.verticesMap.get(playerStartPointId);

        if (walkerStartCoords) {
            this.walker = new Walker(this, this.pointMap, walkerStartCoords, playerStartPointId, numWalkerSteps);
            this.numDestinations = pointTypeOverrides.values().filter((pointType) => pointType === PointType.Destination).toArray().length;

            this.stepsText = this.add.text(0, 565, this.walker.remainingStepsString(), textStyle);
            this.destinationsText = this.add.text(0, 580, "Walking..", textStyle);

            this.walker.takeStep();
        } else {
            console.log(`${playerStartPointId} unexpectedly missing from ${this.verticesMap}; did not start`);
        }

        EventBus.emit('current-scene-ready', this);
    }
}
