import { Vector3 } from "three";

// Pose of the performer the guided camera follows; written by the ceremony, read by the camera rig.
export type LeadPose = { position: Vector3; heading: number; hasActor: boolean };

export const createLeadPose = (): LeadPose => ({ position: new Vector3(), heading: 0, hasActor: false });
