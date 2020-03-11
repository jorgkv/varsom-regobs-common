import { RegistrationTid } from '../models/registration-tid.enum';
import { IRegistration } from '../models/registration.interface';
import { isEmpty, GeoHazard } from '@varsom-regobs-common/core';
import { ValidRegistrationType } from '../models/valid-registration.type';
import { AttachmentEditModel } from '@varsom-regobs-common/regobs-api';
import { AttachmentUploadEditModel } from '../models/attachment-upload-edit.interface';

export function getAttachments(reg: IRegistration, registrationTid?: RegistrationTid):  AttachmentEditModel[] {
  if(!reg || !reg.request || !reg.request.Attachments) {
    return [];
  }
  return (reg.request.Attachments || []).filter((a) => ((registrationTid > 0) ? a.RegistrationTID === registrationTid : true));
}

export function getDamageObsAttachments(reg: IRegistration):  AttachmentEditModel[] {
  if(!reg || !reg.request || !reg.request.DamageObs) {
    return [];
  }
  return [].concat(...reg.request.DamageObs.map((item) => item.Attachments || []));
}

export function getWaterLevelAttachments(reg: IRegistration):  AttachmentEditModel[] {
  if(!reg || !reg.request || !reg.request.WaterLevel2 || !reg.request.WaterLevel2.WaterLevelMeasurement) {
    return [];
  }
  return [].concat(...reg.request.WaterLevel2.WaterLevelMeasurement.map((item) => item.Attachments || []));
}

export function getAllAttachments(reg: IRegistration):  AttachmentEditModel[] {
  const attachments = getAttachments(reg);
  const damageObsAttachments = getDamageObsAttachments(reg);
  const waterLevelAttachmetns = getWaterLevelAttachments(reg);
  return  [].concat(...attachments, ...damageObsAttachments, ...waterLevelAttachmetns);
}

export function getAllAttachmentsToUpload(item: IRegistration) {
  return getAllAttachments(item).map(a => a as AttachmentUploadEditModel).filter((a) => !!a.fileUrl && !a.AttachmentUploadId); // Has file url but not attachment upload id
}

export function getPropertyName(registrationTid: RegistrationTid) {
  return RegistrationTid[registrationTid];
}

export function getRegistationProperty(reg: IRegistration, registrationTid: RegistrationTid): ValidRegistrationType {
  if (reg && reg.request && registrationTid) {
    return reg.request[getPropertyName(registrationTid)];
  }
  return null;
}

export function getRegistrationTids(): RegistrationTid[] {
  return Object.keys(RegistrationTid)
    .map((key) => RegistrationTid[key]).filter((val: RegistrationTid) => typeof (val) !== 'string');
}

export function hasAnyAttachments(reg: IRegistration, registrationTid: RegistrationTid) {
  return getAttachments(reg, registrationTid).length > 0;
}

export function isObservationEmptyForRegistrationTid(reg: IRegistration, registrationTid: RegistrationTid) {
  if (reg && registrationTid) {
    const hasRegistration = !isEmpty(getRegistationProperty(reg, registrationTid));
    const hasAttachments = hasAnyAttachments(reg, registrationTid);
    if (hasRegistration || hasAttachments) {
      return false;
    }
  }
  return true;
}

export function hasAnyObservations(reg: IRegistration) {
  if (reg === undefined || reg === null) {
    return false;
  }
  const registrationTids = getRegistrationTids();
  return registrationTids.some((x) => !isObservationEmptyForRegistrationTid(reg, x));
}

export function isArrayType(tid: RegistrationTid) {
  return [
    RegistrationTid.AvalancheActivityObs,
    RegistrationTid.AvalancheActivityObs2,
    RegistrationTid.AvalancheDangerObs,
    RegistrationTid.AvalancheEvalProblem2,
    RegistrationTid.CompressionTest,
    RegistrationTid.DangerObs,
    RegistrationTid.Picture,
    RegistrationTid.DamageObs
  ].indexOf(tid) >= 0;
}

export function getRegistrationTidsForGeoHazard(geoHazard: GeoHazard): RegistrationTid[] {
  const goHazardTids = new Map<GeoHazard, Array<RegistrationTid>>([
    [GeoHazard.Snow, [
      RegistrationTid.DangerObs,
      RegistrationTid.AvalancheObs,
      RegistrationTid.AvalancheActivityObs2,
      RegistrationTid.WeatherObservation,
      RegistrationTid.SnowSurfaceObservation,
      RegistrationTid.CompressionTest,
      RegistrationTid.SnowProfile2,
      RegistrationTid.AvalancheEvalProblem2,
      RegistrationTid.AvalancheEvaluation3
    ]],
    [GeoHazard.Ice, [RegistrationTid.IceCoverObs, RegistrationTid.IceThickness, RegistrationTid.DangerObs, RegistrationTid.Incident]],
    [GeoHazard.Water, [RegistrationTid.WaterLevel2, RegistrationTid.DamageObs]],
    [GeoHazard.Soil, [RegistrationTid.DangerObs, RegistrationTid.LandSlideObs]]
  ]);
  const generalObs = [RegistrationTid.GeneralObservation];
  return goHazardTids.get(geoHazard).concat(generalObs);
}

export function getOrCreateNewRegistrationForm(reg: IRegistration, tid: RegistrationTid): ValidRegistrationType {
  if (isObservationEmptyForRegistrationTid(reg, tid)) {
    return isArrayType(tid) ? [] : {};
  }
  return getRegistationProperty(reg, tid);
}

