import RegionEdgeData from "@/game/entities/points/regions/RegionEdgeData";

export default interface RegionData {
    siteIdentifier: string,
    edges: RegionEdgeData[]
}