// Tectonic plates today, for the home page globe: where the plates meet and
// what each stretch of boundary does, the plates' names, and which way and how
// fast each plate drifts.
//
// Data: model PB2002 by Peter Bird, "An updated digital model of plate
// boundaries", Geochemistry Geophysics Geosystems 4(3), 1027 (2003),
// doi:10.1029/2001GC000252, as prepared by Hugo Ahlenius, Nordpil
// (github.com/fraxen/tectonicplates), under the Open Data Commons Attribution
// License 1.0. Drift comes from PB2002's Euler poles, moved into a
// no-net-rotation frame (the average turning of all plates removed), close to
// what GPS measures.
//
//   Plates.BOUNDARIES   [{ left, right, top, kinds, at, n }]: a stretch of boundary
//                       between two plates (codes), as n points from LATLON[2 * at].
//                       kinds[i] says what the step from point i to i + 1 does:
//                       s pull apart at a mid-ocean ridge, r pull apart in a
//                       continental rift, u one plate sinks under the other (top:
//                       'L' or 'R', the plate on the left or right of the line, seen
//                       from above, rides on top), c push together on land, o push
//                       together at sea, t slide past.
//   Plates.LATLON       Float32Array: lat, lon of every point, in degrees
//   Plates.LIST         [{ code, name, id, label, w }]: id is the plate's value in
//                       the id map; label is [lat, lon] for the plates a world map
//                       names (Plates.NAMED), else null; w is how the plate turns
//   Plates.plate(code)  -> one of LIST
//   Plates.drift(plate, lat, lon)   -> [east, north] in mm a year
//   Plates.load()       -> Promise of the plate id map: at(lat, lon) -> plate,
//                          and texture() for a shader (id per cell, nearest)
(function (root) {
  'use strict';

  // [left, right, top, kinds, points]: points are longitude and latitude in
  // steps of 0.05 degrees, each a change from the one before, as base-64 VLQ.
  const DATA = [
    ['AF', 'AN', '', 'ttstttssstssttss', 'TzkCQGUKUReSaOcQMJYNSNSMKHQLcSSMYNUN'],
    ['AF', 'AN', '', 'ttttsstttsststtssstsssstsss', '2JhkCWOUQaQWSWLQNeWYQYSMJYPaUaNOIOMsBPkBNeNGI0BLyBFyBHYDFFkBFgBFGC'],
    ['AN', 'AF', '', 'sttttsttttttttssssttttssss', 'moB56BNJLVNTNTNRPJPRNPPXRbPZJXFLJPZGHEDEZGJJHTHRJHHEJETDPE'],
    ['SO', 'AN', '', 'sttssssssttssssssss', 'moB56BoBLISISKOIFEAGFKAIKGUGOIKSAMFOAQCQEQFYM'],
    ['SO', 'AN', '', 'ttsttssttsttttststststtsstsstststssttsststststsstttsststsststtstststststsstststststststststs', '0vB53BEIGOcFIQISqBHqBHGUESaFEUESEUESuBDAKcDAOYACKcAEYEakBEiBEAGaUQAAIkBAAIiBACGcAeAAaCaWAWAAaeICeoBACKQCCYaAaECcAWCWaCaAEaYACUgBAeAAWAACWAUeCDEaAAMYCDMUAAGQDAIiBCkBAAMoBAAIgBCAQKACMUDCMYCAGIDCGMAAIMACESC'],
    ['SO', 'IN', '', 'ssoossstssossos', '6oC+PRKJGEGCGFCJGJEAAHEJEEEHEHCCEXM'],
    ['AU', 'SO', '', 'tststtsttststsststssssststtttsssstststststsstssstsstst', 'q1CxITTKRRRQTVRTPMRVPTPORbTKPdTOTMRXRQXLJKPMPQXQXEHPJOVdTXPZPXLKRKRWfQVMKMPKGMNGCGHMGORLJOXWbRNOTQVMPTPMNKPPLUXHH'],
    ['EU', 'AF', '', 'ssstttttttssssssttssssssttttssssssssssssssssossssssssssstsssosssostsssssssssssssssssstssttttttoottttsootttooottttttrrtccccccccccccccccccccoo', 'nlBoxBQFCDCACCCACACCCACCCACDCDCDCDCACFCCCACACDADCDAACDEAEACCEAGAEDADEDCACDKACFCDADCDCDCDCDCDCDGECDCDCDCDEDADEDGACFCAGFECCFCACFEEEDADEDEEGFEACDCACDCACDADEDDDDFADCDCDEFCDCDCDEDCAEAEDUFaCcCcCcEWCWEsBKUGUCiBDkBHSFKJeIcIgBXeVWVcKSMSKSJeReRiBRSJcLANCLILQAOEODaGKgBCYSKQGOEWJUHeCeEaGYKcISEqBKiBEiBGgBCiBG'],
    ['EU', 'AF', '', 'ooocccccc', 'wI0uBQAYCSEQOMQMGSEQEKG'],
    ['EU', 'AF', 'R', 'uuuuuuuuuuuuu', '+MswBKEKIKCKAMAGFKDQDKLYAUAMEQC'],
    ['EU', 'AF', '', 'cccrrrt', 'kSuwBcTMEGFFJHJDNCL'],
    ['EU', 'AF', 'L', 'uuuuuuuuuuut', 'oT2uBSFQCWEOEKIIMGMEGICCMDIFG'],
    ['EU', 'AF', '', 'oooo', 'uW+wBQJWLcTQP'],
    ['IN', 'SO', '', 'ttttttssssststsosstsosstssstssstststststssttsstststststststsstststts', '6oC+PLTJVJTLTJTLVEFCAIHKKWRDFKHFJMLJJOLMLADQPFFUPUPHJYTURURFLSPSRWRHJULCCQJEEcREEURMQSPSJJPJPOJMLHLONJPUPNRONJLaTNRYTHJSTPPOTQRNPQTXVQRRTRPSX'],
    ['NA', 'AF', '', 'sstsstststsststststsststtststsststsstsststststsststsststtstststststtststststststststststsss', 'v6BqTEWEYDAEUESFCEgBEAEWAAESEQCAIgBIAGYFCEWGAEYEWCAEchBGhBEMcEAMaMDISISIDEIDCGSIUEAIQISCAQcCAQaCAMYYFOaOaKDUYGAQaSaEDIcgBFgBHEKGDISEDISIACGIAKYgBHgBHMYEAIUEDCGKAGWMDEKIDCGKACGKDEKgBFGQMAScGAMUKUGA'],
    ['AF', 'SA', '', 'ttssssststssttttttststststtttsttstststtststssttttssststttttsttssttttttttttttttstststttsstssssststststststttsstststssttttstststsstsststtstssttsstsstststststtsttstsstststssts', 'v6BqTgBFgBFAZAZEDAbAbgBDDXQAAZAXSDSAUDSAUDSAAhBKDAXIDAVWDDZUASAUDUAATaAcDALgBDAPcDAPiBAkBAAVEAATUAEjBCjBSCUASCUAChBEhBChBcDGhBcCiBEUCWCiBEGbaCYCKjBIjBWCWEWCWEiBEWEUEiBGgBGUGSEYEWEKCKjBICIbMEGTeIeIeIIZKZWGGTGTJHGVGTPHCVFAGTQEETOAGXLDCfhBJhBJhBJEXGVGCIlBLDEVHAGhBEhBTHVFVFVHETCCCPKCGZJDCVCTiBGIhBIhBHDGVVFXHCNFDGZEZYEWEEVEVKCGZEZMGEVFAIlBLAGXFAGRXFXHCLVFVFIdECEbGbVFGfRFKjBECIlBKjBUEIf'],
    ['AF', 'SA', '', 'ttstsstssttsststststttsstsstsstsssststssssss', '3PnkBdHfHIZEAGbIbHDGTEVbFZHCVEZPDIVfJGTHDGTnBHlBHfHMRMRPFERERNFGZORKCSHMPETCPVFDTRFCTCRCNONGXLV'],
    ['AF', 'SA', '', 'sssssststssttttssssttstststtsssstssstss', 'zUz1BEXENGTITGTGTcGIXkBEKlBIlBeGcEcEcEIVIVIXIVgBEeGGPCCMhBICMZoBIoBIITKVITKTMCUfWhBWhBmBMURSR'],
    ['AU', 'AN', '', 'ststststsststsstsstststsststsssstsststssttststststssssttsssttttttsssstsssssssssssstssttsssssstsssssssssstssts', 'u3CjgBSRKGONGESPECOLDDSTSRIEMJGEQRSPJLQPQPDFYVJHGFFHQNQPDDWVNLQRSPQRSPfbWTYVDDONZXURURZVZVcVVROLVPOLRNSPbTcVGAaXcVSQUOgBXiBZiBZQOQOQOQOQMQOWNWLWNWNSMULWLULWLWLWLWLWLWJWLWLYJFJiBPkBNTXRVYLaLYLaLaLYLYeYJaJYJaJYJaHaJaHaJaHGKgBHgBJDDsBL'],
    ['AU', 'AN', '', 'ssssssstsstssssssttstsssssstssssssstttsstttsssstsssssssssssttsttttssssss', '2oE99BsBNQDMCIHMH0BFqBJOUuBDUEKMQMiBPcLOCgBHkBFKWOYcFFZQHOFOCKCIIODQUKIICQHQHEJGLaFGMIOIQQDSDDXDPDPuBHsBJuBHcFKQeAwBFgBDgBDIIoBDcCeDcAcAWDEjBCdUCETEVEfCRgBHgBH+BDUXsBC8BC'],
    ['AU', 'AN', '', 'ttttttssttttsttssttttssss', '03FtkCGTGVGVITGVITIAcEObKTKTOXeCKTMTuBIwBKafcfcdef8BQ8BS4BUQE'],
    ['AN', 'NZ', '', 'ttssstttttssstssssttttstttsttsssssttstssttttsttttttttttttttts', 'h/Cj5BbApBFFGLUJcdHdFdHhBFjBDJWJeHgBnBHAGHaFWHWbFbDtBHtBFDKrBDhBFhBDDQbDbAFOASDSDUDUdDbDDUnBDFgBDcfAhBCjBCjBCAWpBEvBCtBEbCbCZEbChBEhBEZEZCbCdCdEfETY'],
    ['PA', 'AN', '', 'tttssssttttsrrrttttttttsssstttttttttttsssttssstssssstttssttststtssstsssstsssstsssstttttssstssssttstttttttttsttttttsssttssstsssssssstttssssssstssssssstssssstssssstsstss', 'ypG7sCeNYTYTWIWGSEOEWPMJaTKFcKeIQEWIOLSLQJWNaPUNOHuBVYKWIOGSGSJUJKFWLWJOHUHaLWLiBLQHiBMkBK0BQcNaPcOwBUwBayBVIEeUcUkBakBYQFqBRyBTkBUmBWcJkBNWMwBRMIgBLkBLcOeUmBaEDWScWiBcecmBLYQWUmBaYYWFSOcaYQWSOFwBPwBPkBLkBJKMUUOWREOOSWSWSYQHkBJQUkBLsBL2BPcJeH2BPcJeH2BLSUYFsBNiBHgBFgBHgBJIIQaYgBmBLsBHMSKaQY3BIEGUWMSMQMUMSQUQWuBLcFaHGUIUKWGWIWKaKcLAGOGWIWKaIYISIUQDEkBEYCYGYGWjBAAEIYIaIYIaNCCGEONCAUCI'],
    ['AN', 'SA', '', 'ststttttssttssttssttttttttssstttstsststttttt', 'TzkCZHXHAVVAhBDhBDPAbDARARfDZADPDLRATDANALVDtBF1BF1BD7BF1BDtBFlBDDALNHPVAfDRADPPDFRFNdDLVrBArBCxBCxBApBGnBG'],
    ['AN', 'SA', 'R', 'uuuuuuuuuu', '1/CjhCHaFaLkBAaCcMaOOMQCcDe'],
    ['AR', 'EU', '', 'ooooooooooccctcccccccccctccccccccccccc', 'qxCwelBDhBDfAbJZAVEVCfClBCjBEVOLeDUDUFeVCfRlBNlBCZQfSZQZWNWCWZUVOTOLQJQXaPCRAPGhBSdURUVc'],
    ['SU', 'AU', 'L', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', '4iEnKQRYRUNKFUNWLSHUHcHYAUFSDQAUFaDQFaFWFaHYDWDYFcDeAaDUCUDYDYDSA'],
    ['TI', 'AU', '', 'ooccccttttttttttrrr', 'k3EtOIAcEiBIWIeMgBMQKOGOIUIUIYISCUCcEeCcIQISM'],
    ['TI', 'AU', '', 'rrr', 'okFrKSYYaKM'],
    ['PA', 'AU', '', 'oooo', '4nGhrCWVQXQPED'],
    ['AU', 'PA', 'R', 'uuuuuu', '2wGp4BGGKIOIQEQIKG'],
    ['AU', 'PA', '', 'tttttctttttttt', '+yGh3BQGUKSKWKOGMIGCQEeEWEWEYEcEUC'],
    ['KE', 'PA', 'L', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', 's7Gz0BYGWGSEUGQMMQKQKMGQGSEOGOIOMcOcSYMaQWEMGIEKEQIKIQGUAUEKKGIOIQIOGQIQISCQEOESESKUGSAQASAKEMCMAMCQEQEM'],
    ['TO', 'PA', 'L', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', '56G3dGKIMGMIMGMIQGOEMGOGMIQGQEOEQCKEMEOCIEKESAMCKAOAMDMAIFIHIHEJIJCFEHE'],
    ['KE', 'AU', '', 'rrrrsssrsrrsssssssrsssrrrrrrrtttcccccc', '59GleDHFTFVHhBJfLbLZJdLhBFNJXHbFPLRLZPbNZPbNXNPVfRXTbNRLRLRLPDFPVShBJLNNLJNJPHERIJWN'],
    ['PA', 'NI', '', 'ssstt', 'v8GrSUGWEWCaDKH'],
    ['PA', 'TO', '', 't', 'r5GnSSD'],
    ['WL', 'MO', '', 'ccccccc', '2tFhCKVKVOZKTMRIXKV'],
    ['WL', 'AU', '', 'cccccccccttc', 'gwFtGCDaZeLcNYLYLYJUPQNeTUNCJ'],
    ['SB', 'SS', 'L', 'uuuuuuuuuuuu', '45FpJcOWEMCUIUKOKQKOIQESFQJSN'],
    ['NB', 'SS', 'L', 'uuu', 'ugG7HKLONQV'],
    ['PA', 'SS', 'L', 'u', '2hGlJUJ'],
    ['PA', 'WL', 'L', 'uuu', 'qiGtJOJKJKL'],
    ['SS', 'WL', 'R', 'uuuuuuuuuuuuuuuuuuu', '45FpJGFIFIDIAKCKAMDQDODQFQFOHOHMHKHGHCFEFAN'],
    ['AU', 'WL', '', 'srrrrrrrrt', 'y9FnMFCXAXAJLXGXSRJXObMZM'],
    ['PA', 'AU', 'L', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutuuututuuutuuuuuuuuuuuuuuuuuuuu', 'sjGnKGLKHEDCAEDEDGDCDCAEFGDEDCDGDCDEDCDEDEFGDEDEAEDCAEDEACDCDCDCACFEDCDEACDEFCACDCDEDCDEACFEACDEDCDGFCACDEFEDCDEDCFCACFEAEDEDCAEDGAEDEDEAEDECGAGAGAICICGAECIAICGAGCGAECGAEAGAEDGDGFIFGHEHEJELCHEJCLAFCJCJELCJAF'],
    ['NH', 'AU', 'L', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', '2vGpRADCHCJAHADAHAHAJDHCFDFAFAFAFCFAHCFCDCHCFCFCHCFCFEFCFCHEFEFEFAFCFCHCFAHCFCHAFCFCHAFAFEJEHCJCFEJCFCFEHCFCFCFEFCHEJEHCFCFEFEHEHCFEHCDEFAFEFEDEDEHGFEFEDCFEDEDEDGFEDEAEDEAEDEDGAEDEAEDEAGAEAEAGDECCDEA'],
    ['CA', 'NA', '', 'oootttttttttttcotttttttttttttttttsstttttttttrrrrrrrr', '/sC2XbObKVGRAZEhBCXAXDhBDVDTAjBFXEZEbIbIVCXElBDfHfFVDVDZFbFbHdFbFbHXFXFVFVFCVEXbFZDjBHXHbLfJbJbJfLbNXPTRPRPRRVPVFhB'],
    ['CA', 'CO', 'L', 'uuuuuuuu', '1xD4PYDcLcNYNQNSNUXMN'],
    ['CA', 'SA', '', 'tttttttttt', '9vCmNaDYAUDYAYDUDSDkBFSAUD'],
    ['CA', 'SA', 'L', 'uuuuuuuuuuuuuuuuuuuuuuu', '3oC2MQUIUGUDgBFaHeFaFORMLGFEDOFKAQNUPOPMLKLQLMJEHMbC'],
    ['CO', 'NA', 'R', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', '1xD4PRKRKPGJDPMPIPEPIRIVMNILIPIPIRCXATAVGTGTETGRKPGXGVIjBQfKfMZMRKJCNGPKJG'],
    ['CO', 'PA', '', 'ssssstssssstsssstsssttsssssstss', 'hkEsWIHCdDhBCdCTYGGZEZKdKfIdHDETCTEdCHdFAjBCdAFaAaCGZGZEjBEhBGlBEjBDDCNAJ'],
    ['CO', 'NZ', '', 'sstssstsststssssstststsssssststttssstttttttt', '38D6CEDeFAEWDUDMADJcAcDEQkBDAMgBDgBFaDcDGDAJWAAJiBDCbiBDkBAkBDiBDkBDiBDCgBeDCSAUEWWCUAYDFUASAUAUAgBAcCWAK'],
    ['EU', 'IN', '', 'cccctttttrttccccctttrrccccc', 'qxCweSISKYOWMGUAUAYEgBAUFGCiBAQWKSHQdQFgBGIYEWCYHSHSUWUUSWSUYc'],
    ['EU', 'IN', '', 'ccccctcccccccccccccccccccccccccccccccccccccc', 'y6CsrBYVWXcVgBLWdCXgBVURaJSNMPUJMNYLSDMFUJMRiBLeLcNUHUHmBHaDKPMFQOWFWAoBGSJYEkBCWCUAmBCMAaQaQYMgBDWDWA'],
    ['NA', 'EU', '', 'rrrrrrrrrrrrrrrrrrrrrrtttt', 'k9E2hDeTeTSZQZSXSXaTYVqBbyBbeReTiBZeXOHgBZYNuBZSXSZmBTkBTyBPyBPYVYV'],
    ['NA', 'EU', '', 'ssstssstttsssttsssttttssssttsstsssssssssssssssssssssssssssssssssssssssssssssssssstttttssttttttttsttssttsssssststssssssssssssstsssstsssssssssssssssssssstssssssststssssssssssssssssssssssssssssssssssssssssss', '1T+2CMMQMKKMDIGIKGCUDUDaHKGOIMGVEVEKGQIOGoBHmBH6BLYFSIWESCIEWFQFQEMCOFeEWEaEeEYEcEYGsBIgBEgBGcEaEaESEeGKCOCQEOEKCKCIEECECEGCEAEDGAGHGJIHIJGLELIFGLIAKFEAICGAGCIAGCIGOEIHIEIDGpBIxBIlBGjBGRESIUMtBElBGlBEjBGlBEdChBEZCaKzBGRCWIQGrBExBEUIKCvBMUGeKEC1BGjBI3BGmBGsBKoBImBEiBGuBGeGiBEkBEmBGeEiBEICSDcE6BE8BGgBEiBDiBEqBE+BG4BE4BEqCE4BEyCEwCAyCCyCAcAsBDkCEgDG6CEsDGqEGmCCwDCLC6BCiEC4ECqECsEAmBDkFFLDqEH/BHuDFyCFyCF0BFyCHsDFyCFiCDwCFkCD8BD8CDqCFkCD4BD0BFkBDqELqBD2BF6BHmBDyBFgBFwBHoBHkBHiBHiBJcHWHgBLWJYL2BJkBVoBVkBTeTeToCfUjB'],
    ['NA', 'EU', '', 'sssstsssssstssssstssssstsssstssssstsssstsssssstsssssstsssssssstsssstsssstssstssstsssstsstssstsssssstsssssssssssstsssssssssttssssssssssssttsssssssssssssssssssssssssssttttssstttttttttttttttsssstssstssssssttssssstsssssstsssssstssstssstttssssttsssstsssstssssstssssstsssssssss', 'nlBoxBGYACACAADAAEAECECCDECCIDCGAGCGAGACDCAGCECIAECEFCAGAECCACLACECGACCCACDAAGAECEACGACEEICECGCCCCMAAEAEACCEACACEACEAECECGCEACACCCDAACCEAAAEEDACACAECCAAACACCACAACAADCEAACCEAGACCAACACEAACCEACCAAEACCGAGACACCAAECCAEDEDEACAEACACACAEACFADEAGDEAEDEAGDCAEAEHAFADEDEDEDEDEDCDCFEACDGDEACHAFADEDCDEDEACAEHCDAFEHEDCDCFEFEFCACDCDEDCAEAGAGAIAGAEDEAEPARCLAJAAGAEACPCLCJANCNCJAHAPCPATARCPAAAFAHAAGAGDGACFCAGCCACJCCECIEECGCECEJCJAEGCICECECCHCEGEICGGICCAEKDCGCECGAGCEACEACECCCEGAACCCACIAEDEACGAECCAEEAICGGCECCCCEAEEEGECCCGAIGEEGECCCCIAEEGGEEGECEIDGGIGGGGGECIGIEGEGG'],
    ['PA', 'OK', 'R', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', 'y0FizBCNFJDHDHDFDJCJDJALFJDJDHDJAJDJDLFJFJHLFJFJHHHHFFHDDHFDDDFNHHFHDHFDALDLFT'],
    ['PA', 'JF', '', 'ttttstsstssssttttssssstssstsstsssttssstssss', '/7EsyBdCdCdAfCAEFACWEUEDCEGCIaQalBQpBQnBQpBQGOMOHEKOEGJCAKGCEIKDMaMcLEKSJIKOhBOhBMOUHCGGJEEGVSNMIQ'],
    ['JF', 'NA', 'R', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', '/7EsyBJOAKHKFKFKAGAIDGCGECAGDCDMAIDEDEDIDMCIACECAKAIDGDEAGAIDOHUFOHOFMFQLQHKLMLKRIJGJIDQJMLEFININITGNILKJIPENI'],
    ['OK', 'PA', 'L', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', 'y0FizBaSYUUMUKaOoBUmBUqBUWKUKiBSaQaOaWSQUQYSYUaSWSWSWMUMeccaOaaUiBOOYUeOSQQ'],
    ['NA', 'PA', 'L', 'uutuutuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', 'itGglCgBLkBPaPoBPgBPaPkBPmBPuBTsBPyBN2BNuBJoBJgBFwBFsBAcAeAaAkBEWGeEgBCeCiBEiBEeGeGeISEmBKwBKcIcIeGcIeIgBGeGeEeGgBE2BKmBIkBKkBKsBSoBOkBSqBKaISEkBOmBQgBUcUUSUS'],
    ['NA', 'PA', '', 'ccccccccccccttttttttttttcctc', 'n2FiqCeOcMmBMmBKgBDWFkBEeNWPURWRcVIPQTMXMVSVKNWVUVMRQVORQPWTWTQPON'],
    ['NA', 'PA', '', 'cttttttttttttccccccctt', '/7EsyBOAKRKTMTMTYdMNQPcVQPSTUTYTSHUJOFMFKFOHUHSNSP'],
    ['NA', 'PA', '', 'trttrttrttttttrrttttrttsrtttrttttttttststtttstttttstttttstttttstts', '3wE4pBGHFFEFEFFDIJIJHFKHOLKJGJGHEFLHFFGJGJGJIJLJGFGHFFFFGJMLIJDDKLMJIJMJMJMJIHEDHNIFHHKLMHIHCDFHKHKHMJGFCDJJIHIJKHGFGFLLMLIHIJGHEDNPKHQFLN'],
    ['NA', 'SA', '', 'otoottttssssssssssssss', '/sC2XgBKgBKgBFiBHgBHcPcTYTaVcHcJWJYJaLaLWJaGYCcDgBDMHaP'],
    ['NZ', 'PA', '', 'sstststsstssttststsstststssssssttstsstsssstststtssstssstststststsststssssssss', '9/DAFVFhBEADLGDFNJAFXDVIAAVJZlBElBEHNdCHTdCJXHXHAARFAFTVEHRDTLNHfHFFhBfEdGFhBJCHTFdHADZJDLVHhBIAFbJADHZEZCATHJAbHAFXFXFXEAJNEDJPGALTIDLTGAHTFNGDLVEAJbFPHLHDHVDTFFAT'],
    ['NZ', 'SA', 'R', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', 'h/Cj5BIgBAgBGQEcGaASAUIUAUCWAKGUGUIQCYGiBIWOWIcSYMSEUDYGSCeEYAeCaEaMYIWEUEYEgBGeCiBCeCeCgB'],
    ['NZ', 'AP', 'R', 'uuuuuuuuuuuu', 'l5CvbCcDUDUHSLUVYVSbUXQbWdSZY'],
    ['NZ', 'SA', 'R', 'uuuuuuuuuuuuuuuuuuuuu', '9+C3TVWPORQVWVULQLOVeTYRePaPSPgBNaJcLaHaDeAeCgBOS'],
    ['NZ', 'ND', 'R', 'uuuuuuuuuuuuuuuu', 'hmDjEDKEWDaIcGgBOeOYKUUUMQOOUYMaKgBIaFU'],
    ['ON', 'PS', 'L', 'uuuuuuuuuuuuuuuu', 'ygF6fWQOOSSQWMUGSSGIGGMCEGGEQMQOQKMGK'],
    ['AM', 'PS', 'L', 'uuuuuuuuuuuuuuuu', 'gmFumBGIKKMMWQaMOGMEKEQGUGWIUOUOOMEWGS'],
    ['OK', 'PS', '', 'ctcootoo', 'qtF6rBYDIHSHWDQFKFOFSH'],
    ['PS', 'CL', '', 'oooooooo', 'koF4IkBFgBEWOQKQKScMaCI'],
    ['PS', 'PA', 'L', 'uuuuuuuuuu', '+sF4LIWGcEScJYCaFiBIUKiBEGG'],
    ['MA', 'PA', 'L', 'tuuuuuuuuuuuuuuuuuuuuuuuuu', '8yFuOQDaMSIQIOEOOUOWOSiBKeKcEiBCgBDeAYJUHYLWJUJWLQVSfUZWdUVa'],
    ['PS', 'PA', 'L', 'uuuuuuuuuuuuuuuuuu', 'szFweRUAAAcGeAQAcFUHWLULYDWLWDYDcFWAcHSCU'],
    ['KE', 'TO', '', 'tttr', '56G3ddFbFXFVD'],
    ['NI', 'FT', '', 'ssrrrrssr', 'v8GrSAHCFDHAHDFDFFFFFVC'],
    ['NI', 'AU', '', 'rsssssrtttttrrrrssssssssssssst', 'v9GvTFHHFFFFDDDAFDFIFGHGFGHGJEHEHEJCHEJCFEJAFDFADFHDHDFDDAFCHAJWJ'],
    ['TO', 'NI', '', 'sssssstsrrrrtssssrrrrrrrtrrrrrrrrrrc', 'r5GnSDFFFFHDFDHDHNCFFFFDHDHAHKDCFAHDHCLAHAFCJDDDJCDDLCDAJFJFJFHFJFJDJDLDJALhBM'],
    ['TO', 'AU', '', 'sssstsssssssssssssssssssrr', 'h8GpYDLDHAFFJEDDFAHDFAHDHAFDFAFDJDJDFDJFJDLDDAJDLHNJPHNHR'],
    ['SC', 'AN', 'L', 'uuuuuuuuuuuuuuuu', '1/CjhCIlBMVMVSPUPaPYPUNcNeNuBPuBLuBJoBTyBLyBJ'],
    ['SC', 'AN', '', 'ooooooo', '5wCvoCqBRoBL8BR2BTeNeL0BX'],
    ['SL', 'AN', 'L', 'uuuuuuuuu', 'lnC3rCZNbFfHnBFhBHdJjBNlBLjBN'],
    ['SL', 'AN', '', 'trrrrrrrr', '/vChuCaRkBJaNiCO8BQwBKsBKiBOuBI'],
    ['SC', 'SL', '', 'ooocc', 'lnC3rCaJSCeDeLAV'],
    ['SC', 'AN', '', 'rsssttttt', '9jC9sCwBSqBMmBIIS0BC2BE0BA2BH2BH'],
    ['EU', 'AF', 'L', 'u', 'gZsvBMF'],
    ['AS', 'AT', '', 'sssrrttrrrrrrrt', 'mlBqsBPMLIPQRaHKAKCKFILMNKVQXQPKRGTS'],
    ['AS', 'EU', '', 'rrrtttttrrrrtc', '4fmyBTDRDXHJJPRLPLPJPZEXCVCbAHPAN'],
    ['AR', 'AF', '', 'ccccccctctt', 'wtBgtBCLDTFhBNRLRFTFVFfHZHdJd'],
    ['AT', 'AR', '', 'rrtcccccctct', 'wtBgtBAKCUOaMEYOOGMEUIWIeKSEQK'],
    ['EU', 'AR', '', 'tcccccccttttt', 'ozB8wBCLILYLSHUJQNSNONOXGXGXITGR'],
    ['AT', 'EU', '', 'tttttttttttttttrtttrrttt', 'ozB8wBXMXMbITEhBKnBOlBKZGdEXClBHpBHlBHRFPAfGnBDPDdDTCNGbLZJZJ'],
    ['OK', 'NA', 'L', 'uuuuuuuuuuuuu', 'itGglCdYfYOSQQOQQSQQSQ0BU2BS6BSgBckBe'],
    ['OK', 'NA', '', 'ttttttttttttttcttttt', 'u1GmtCrBFpBDpBFpBFlCDjCFpBApBCpBApBA1BE3BE3BE5BE3Ba5BY9BY9BYhCYjCW'],
    ['OK', 'EU', '', 'rrrrrrrrrrrrrrrrrrtttt', 'm1F0xCWjBUjBUjBSjBhBPjBNhBNhBPfNfPFTFVFTFVFTFTDVFTKXKXKXIV'],
    ['OK', 'AM', '', 'ccccccccccccccccccooooooooooooooccccccccc', 'gyFyjCSbDPFVHjBHjBEXGVEXGXlBbhBbbTZTZNJLFXJZLVDPKfATAfDLLLARKNFPARNJLJLLFREVCbAbDZCNILGNGRKN'],
    ['AM', 'EU', '', 'rrttttttttttttttttttrrrrttttrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrccttrrttccccccccrrrrrrrrrrrrr', 'gyFyjCtBAvBCnBK1BK1BK7BI9BIpBKnBInBGnBG5BQ7BO7BQnBClBAnBClBCnBAnBAlBHjBHlBJjBJ5BD3BH3BF5BFvBTPRRTNfNfdNbPdNbPbPbNUbUbIjBIjBEXGVGXEXGTGRGTGTGTGTmBVkBVaZiBTkBTiBVYOaQiBLiBLWNYPYJaJYIYIoBQoBQSMUKSMUMebedebITITGVGTIhBIjBAXCXCbCd'],
    ['EU', 'SU', '', 'ccctrrrrttcccccccccctttttt', '04DgSkBAkBCkBAWQWYWaMUMSYMWMYAWCWAYCkBAmBAmBCmBAkBAmBAWCUEWEWCaIcG'],
    ['YA', 'SU', '', 'tttccttrtctcc', 'wuEiXQQWUWOgBEiBGOQOOIgBSYSFaKSNQN'],
    ['BU', 'EU', '', 'cc', '04DgSDUDK'],
    ['IN', 'EU', '', 'tttcccccccttttttttttc', 'w4D+SAKCYAaAgBDWDcFcLaDiBDgBAaAaCeGeIaMUMaKUISESFQ'],
    ['BU', 'IN', 'L', 'uuuuuuuu', 'szD2IEZGbEdKZOdUbaZYP'],
    ['BU', 'AU', 'L', 'uuu', '42D0CWJWREH'],
    ['SU', 'AU', 'L', 'uuuuuuuuuuuuuuuuuuu', 'o4D2BILKPObObQdMRKPWbUbMTOROVSbWdUXYbeRWLiBN'],
    ['EU', 'YA', '', 'rrrrrrrrtttttrrrrrrrrrrrrrrrrrrrrrrrrrtcccccctrrtttt', 'wuEiXLQLSLQJSLQLSLQLSjBMlBOjBMlBOjBMXYXYZYNWNWJeLgBISKSiBSkBSkBMkBMmBKkBMQQQQCYAYYYaaOOOQcAaAgBbeZgBbQRSPSRQRcJaIcIWDYAYDWD'],
    ['AP', 'SA', '', 'ttrrrrrrrrrrccccccccccccccccccccccttrrrrr', 'l5CvbYIaKmBAmBAUAUAUAWAaCcAYCYCIYGYFaFaJSLUASfChBMROPQXaVYJWZUZUTGTGZIbKbIbKZDZFZdZdTZVZVb'],
    ['PA', 'NA', '', 'tssssss', '5nEsbFCEGEEDEGGGGAE'],
    ['RI', 'PA', '', 'ssssstsssssstsssssttsttstttttttsssst', '5nEsbDHHFDFFFDFIFFJFFFHFDDFDFEDAFFHFDCDFFMLKHAFOHOJDFSHMFKFKFKDIDMDDJAJAFADcD'],
    ['NA', 'RI', '', 'ooooooooo', '5nEsbIDMHGAICGAIAKAEAGC'],
    ['NA', 'RI', 'L', 'uuuuuuuuuuuuuuuuu', '1lEobCFCDCHGJCDCDCFCLAJAJCLENGLGLILIHML'],
    ['RI', 'CO', '', 'oooo', 'hkEsWEKCIEIEI'],
    ['PS', 'YA', '', 't', 'g4E8eLK'],
    ['PS', 'YA', '', 'cccccc', '23EmfPNTbJhBCZAXCR'],
    ['PS', 'SU', 'L', 'uuuuuuuuuu', 'y2EibFTDXIRDNPTNZVdHXEhBAN'],
    ['PS', 'SU', '', 'tttttttttttt', 'i1E2UUHSHSHUHSHUHSHSHUHSJSHUH'],
    ['PS', 'SU', 'R', 'uuuuuuuuuuuuuuuuuuuuuu', 'k8EsSKXOjBIVSXEZDZOfKjBKdGZCjBAjBIXCTOLMTKRMbMZITCdDlB'],
    ['SU', 'BH', '', 'ocrtr', 'y+E+CYDaAEPWPSX'],
    ['BH', 'SU', 'L', 'u', 'y+E+CRb'],
    ['MS', 'SU', 'R', 'uu', 'i+EkCNdJhB'],
    ['MS', 'SU', 'L', 'uuuuuuuut', 'q6EwCLAdQjBFjBAZFVHRTDlBKhB'],
    ['MS', 'BS', '', 'rrrrrrtoooooooooot', 's1EFQfUZQLSLUJSJYLYLKLCjBLbYFYFaAYCWMUKOU'],
    ['MS', 'BS', '', 'ttt', 'k/E1EIWGcAc'],
    ['MS', 'BH', 'R', 'uuu', 'u9ENAUIgBMc'],
    ['BS', 'SU', 'L', 'uuuuuu', 's1EFJZLhBHTJTFjBIP'],
    ['BS', 'SU', '', 'tctcctt', 'w0ExEePQPQPGbEhBDjBAjB'],
    ['BS', 'AU', '', 'ttrrr', '8lFtIUIUGMcXMSW'],
    ['MS', 'BH', '', 'tttt', 'y/EnCROTQROTO'],
    ['BH', 'BS', '', 'c', 'y/EnCeX'],
    ['BH', 'BS', 'R', 'uuuuuuuu', 'wgF9CiBFiBFUJSHSNQNQVQV'],
    ['BH', 'BS', '', 'co', '8lFzFYJYH'],
    ['SU', 'TI', '', 'tttttt', 'k3EtOEaCcLWJYAYDY'],
    ['BS', 'TI', '', 'oooocooooooooooccoccc', '22E5JcJaDeIeCiBAUGUGUCUGUEaASISIUKSIYJYHWAYCWAWD'],
    ['BH', 'CL', 'L', 'uuuuuuuuuuuu', 'wtFvBHOZEZEVIVGhBKdQVHXJXJXENC'],
    ['BH', 'PS', 'L', 'uuuuuu', '0lFAHCZEbEXIXKhBO'],
    ['AU', 'MO', '', 'tttttttttt', 'gwFtGXGVIhBITEVEhBGXAVAdAVF'],
    ['AU', 'BH', '', 'tr', '2oFtFTHZP'],
    ['MO', 'BH', '', 'tttttrrrrr', '2tFhCTHVHPJPJPJRNRNRNVTNT'],
    ['SU', 'BU', '', 'trrssssttrtttrtsttttrrrrr', '04DgSALbPPlBPjBPjBRVRXITITRLGNMRMTNLSTRNSZUXWZWTClBEfEhBDTXR'],
    ['IN', 'BU', 'R', 'uuuuuuuuuuuu', 'szD2IRcFUHUDUDSASCSAgBCUCUIiBGW'],
    ['IN', 'BU', '', 'ottttttt', 'izDkRScSSQUSIQIkBCgBLUR'],
    ['MS', 'SU', 'L', 'uu', 'u9EIPPPN'],
    ['MS', 'SU', '', 'ttttttt', 'y8ETRITKRSLQJUFSAI'],
    ['EU', 'NA', '', 'ssstsssssstststssssssssstttsssstsssssssssstssssssssssssssssstsss', '1T+2CPNJJLLbCLHTNPPNNLNPRoBFHHgBFLPwBHHLJLHNHRJLTLjBNRJJHjBEbCXCfHVDNFJFNAHFLFLFLFLHJFJFHFFFHFHAJFJFLHJHLHJFNJJFHHJHLJHFJFJHLHJHFDFADFFFHD'],
    ['IN', 'AU', '', 'sssssssssssttssssstooooooooooooooooooooooooooooo', 'q1CxIeKgBEUAUDUFWFUHWJUAGiBGQCiBGaSFUFaNcLYAWAaCYCWIWIaGcIaGaISISIUISKgBJgBHcPcRcWcYKcIcQOOQiBOgBOgBMgBOgBOWYYY'],
    ['PA', 'AU', 'L', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', '2wGp4BLJHHHHJLJHFDHFNHNJHJDJDJDHFFDJDDFHDFAHFHAHFDAJFHDHJHFJFJJLFJDFFHDF'],
    ['PA', 'AU', '', 'tottttttttttttttttttttsottttooootttttttttoooooooooooo', 'isG1+BJHFFHFJFHFJHJHLHFFHJJHJJFHNLFHFHJJLHJJHHLJJLFADJHNFJHLFHDLAFDJFLFNFJFHFHFHHLFNDLDJAPGLGNILGJGDKJMLKJILMJED'],
    ['ON', 'PS', '', 'tttoooooo', 'g4E8eITONONUJUAWAUDUAUA'],
    ['ON', 'PS', 'L', 'uuuuuu', '+8EodQEUKSOUQUSWU'],
    ['YA', 'ON', '', 'rrrrrrsrrrtrrrrtrrtrrrtrrcrtrcrtt', 'g4E8eQGWIaJUCCEQCWCAQSCYEFMQGOKEIMKDIGGUODGKGSKUOLMQOOMRWKIDMIILQKKCGOQ'],
    ['AM', 'ON', '', 'rrrrrrrss', '6hF4nBMKSDaASFQHOLILOLIL'],
    ['EU', 'AM', '', 'rrrr', 'm6EqnBccecccec'],
    ['AM', 'YA', '', 'tttttttttt', 'm6EqnBUFaFWDcAaCaAYEYEWGaI'],
    ['CL', 'PS', '', 'oosssssssssssssssss', 'koF4ILRLLPJJJHJDRDPHJHPFPDRCRCRDPDNAVDZDPHhB'],
    ['PA', 'CL', '', 'ttttttttttsttttttttttooootooo', '+sF4LiBPcJcJSLSNeVQJQLUPUFYFQFQHWJQLOROPMROPSZUbDVCZAXGXKXEXCLAL'],
    ['CL', 'NB', '', 'oocoooooooooooooo', '6xFtDGKKWKSOMWIWIcISEQEcCSAMCUJUCOAIDOJ'],
    ['PA', 'NB', '', 'ooooooooooooooooootoottrttoo', 'y6FbKHKJKAOFOFQFOHOJOJSNMAIDMLGHGFIPGNILEPOPKLCPAPRPDNAVITIT'],
    ['CL', 'WL', 'R', 'uuuuuuuu', 'wtFvBSLWHSJYHOLQFKHQN'],
    ['WL', 'BH', '', 's', 'wtFvBGT'],
    ['NB', 'SB', '', 'cttttcrrrrrrrrrtrccttttttttttt', '2zFrEYFSAYCcCMASNCEEGEECGEECEEEECCACAIEIFEHKFGDIFIFIDIDGDGAEDCACA'],
    ['NB', 'WL', 'R', 'uuuuuu', '6xFtDIFIHMDIDOFKN'],
    ['NB', 'MN', '', 'ssssssstcccccoocccoooooo', 'o7FxEEEGGEEECECECCCCACAADCDCFCDCDAAEACACDAFEDCDCACACD'],
    ['MN', 'SB', '', 'ootttttssssssssss', 'o7FxECDEDEDCDEDCAADCAGCEAGCEAEEEAEFECEE'],
    ['NB', 'SB', '', 'ttrtrrrrrttttttttttttt', 'k9FzEEDCDEEGFECGACCCAEAEFEDCFEDCFCFCDMRKRIPIPIPGJ'],
    ['SB', 'WL', '', 'rrrrrrtccccoo', '2zFrEONMLIRGNELGLUXUPURSJWRUJYF'],
    ['WL', 'SS', '', 'tttttt', 'qiGtJJHRNPPRPRNTL'],
    ['WL', 'AU', '', 'stsssstsssstssssssssstsssstssstssststsstsssststssstttt', 'y9FnMIAAHCDEAEAEAAFIAGAEDIAANMAIAICIAEAGAEACCCAAQICICECGCAHEAECECAGGCCAECADGAADECEAAAEAEAAAEADGCAAGGAECEADQDIAIDK'],
    ['PS', 'MA', '', 'ssssssssssssstststsssstsssssssssssstssssssssssr', '8yFuOAKAKCIEKGIEEGKEIEMCCCICMEWEAGKIAFaOEASCQDUHQMGJMDGDGAIDQDMACNaFADEHKFMLAFGFIFIAEAKFODMHILKJKNO'],
    ['PS', 'MA', '', 'rt', '6xF4cacYc'],
    ['NH', 'PA', '', 'sssssstsssssssssssssssrcc', '23G5QFDHDHDJHPDNDALFDLANAAGVARAAGHAHAJAAGJALAJCAETApBHpBH'],
    ['CR', 'NH', '', 'sssssstsssssssssssstsssrs', 's5GjVANHPFJFLHNHNGCCLALAJALDJDLAJANCJALAHAHcAAJALALDRAL'],
    ['NH', 'AU', '', 'ttsts', 'y3GhdOGKCGGQASO'],
    ['BR', 'NH', '', 'ssssssssssssssssstsssssssss', '23G5QINGLEPGJCHAFCHCFAFCDAFCFCFADCDCDAFHFEFCHAFFFGLCFCFEFED'],
    ['BR', 'CR', '', 'tototoooo', 's5GjVYMQNIEGAGEECEAMCMA'],
    ['AU', 'CR', '', 'ssssssstssssssssssssssss', 'o8G3UAFDHDHDHAHDNDLQAALDFDFDDANDHFHDFFFADAJDFFFJJALCJ'],
    ['AU', 'CR', '', 'ssstto', 'w7GpZKTKVPLVPbRXP'],
    ['BR', 'AU', '', 'ottttttttttstsotttttttttss', 'o8G3UIAGAEAGAEACCEAEACACAGAAIDACEIAEDEAECECEACCGAEAEAAECE'],
    ['BR', 'AU', '', 'ttttt', 'm/G9TQEQCKCMCOE'],
    ['PA', 'BR', '', 'srsssssrssossstt', '23G5QUFYAMIWFGAGAECQEOFMDCLKAOFOFIFKF'],
    ['PA', 'BR', '', 'tttttt', '49GzRaLQJWNQJQJSP'],
    ['PA', 'AU', '', 't', '3gHvTMA'],
    ['FT', 'AU', '', 'tttt', 'rgHvTaGWCWDWH'],
    ['FT', 'PA', '', 'tttccststs', 'v8GrSXAVDPCVOVMALHCHfLAHZ'],
    ['EA', 'PA', '', 'ssstststssststsstsssssssstt', 'hvE1bFFAPDTPDDHLDDHPDITAFFFRHDHLDAFENRNGLMLMNKNIJIHWHYDOAYD'],
    ['EA', 'NZ', '', 'stsssststsssssstssssstsssssssttooooo', 'ptEzhBCGKFCKDKCKCECAAGEAAEECAEDEDKAGSAAGDKDIAKAEQCDIFEAKAGEGHINIRIPIPINCNCJANA'],
    ['JZ', 'PA', '', 'ssssosssssossssssss', 'hsEvnBDJAJAHFLJADHANDNANDLFADPENGLIFSHOFKFMF'],
    ['JZ', 'AN', '', 'ssssst', 'zqE9rBMCIEIGKEIESC'],
    ['JZ', 'NZ', '', 'ssssssssooooooo', 'zoEnrBDOCMCIFMFKIGKCLMLKPMRIVIVGTAPA'],
    ['NZ', 'PA', '', 'ssstssstsssttssssssssts', 'ptEzhBFHDLAPGACLANALDAAHALCJYHWFCPARDJAJDJDDDRDPCADH'],
    ['GP', 'PA', '', 'sssssssssssstststsssts', 'z/DqDDFADAAAFAAADADAHCADHADADAADFFDAJAACJDACHAAAD'],
    ['GP', 'NZ', '', 'sssstssstssstststoooooo', '5/DuBECGCGEGCCFEEEDCCCDECCAECACEGACCCDEFCFEFCFCFCDE'],
    ['GP', 'CO', '', 'ssss', '9+D6CAOJCJAHA'],
    ['PA', 'CO', '', 'ssstss', 'z/DqDDGAAAEDADGAI'],
    ['NZ', 'PA', '', 'stsss', '5/DuBDTCADPDJAH'],
    ['CO', 'NZ', '', 'stsssstsss', '9+D6CMAADGAQAKAOAAEGDEACA'],
    ['SC', 'SA', '', 'ooosstocoocoooooooooottttttttttttrrttttttttttt', '9kB7kC5BK7BI5BGQRMZbHlBH9BEfSnBElBKpBInBKnBKhBKhBMpBOpBMxBEzBG9BC9BD/BHxBP3BJjBHjBF1BA9BC1BD5BHjBFlBFtBHrBH/BFhCDjBIbGhBIhBIlBQrBQnBOfKfK'],
    ['SW', 'SC', '', 'ssssstsssssstssststststststssstts', '9kB7kCJHFHAHCFDFVDDFAFAFAFAHDHNADDADANMACLKAEVIAAbHACXQAAdXACTGJMNkBAoBAAH'],
    ['SW', 'AN', '', 'tt', '1iB5rCgBEiBE'],
    ['SC', 'AN', '', 'ttosottssr', 'r3BrrCsBHsBFiBV2BOeP+BLuBH+BQ4BMsBM'],
    ['SC', 'AN', '', 'tttt', 'voBxrC2BFyBFoBAqBA'],
    ['SW', 'SA', 'L', 'uuuuuuuuuuuuut', 'zgBxrCoBSYWSUIcPeFMTQTSXSdSZGZGrBEjBD'],
    ['AR', 'IN', '', 'ooottttotttttt', 'orC6WKWKUKUMSKQOUKKCcOMQMeUaUOOQO'],
    ['IN', 'AR', '', 'oooottststsss', 'orC6WHhBDfDXDZLNLPPITTRKJNVCVAfD'],
    ['SO', 'AR', '', 'ssssssssstsssttssssssstttsssstssstsssttttttssstssttsssttsttsstssstsssttssttsstssttssttssttsssttsstsssssssrr', 'qmCoSDCADHCLCHAAAHCJCJCDHFCJCJCDFDHDCDADCDADADCFADFDHFHDAJELCHCAAFAJCHEFHFCLCHCJPJNJRFJFJFHHELEJCFHFCHCDDFHFCJEHCFHHHACFHDFLCHCFHFFHCFCFJFCFCFADDFHFCHADDDFLEHAAFFCDADFFFHCFCFFDFHCFADDDDLCJCAADFFDDAFCDDJAJAAAFANATARAhBJhBJ'],
    ['AF', 'AR', '', 'rrrrrrrrrrrrrrrrrtttt', 'kxB6XTQTSPUFYFiBNaVeVQHUHUJQHSPQPSPSNSNaIUGWIUGW'],
    ['AR', 'AF', '', 'rrrrrtrrrrtrrrtr', 'kxB6XMbQTOdFTFVVXGZKTKRMXVXQZORORSQQZ'],
    ['AS', 'AF', 'L', 'uuuuuuuuuuuuuuuuuuu', 'sZovBSdYTKTMLUJSNWTSPeNoBFiBDgBGSOOGSMMGKEMAQC'],
    ['AT', 'AF', 'L', 'uuuuuuuuuutttt', 'mlBqsBSNYHSHUJQHUFSFaAMISMQMSMSMYM'],
    ['SO', 'AF', '', 'rrrrrrrrrrrrrtrrttttttttrrtrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrttttccccttttrrrrccttrrtt', 'y0BwOZNPXNZPPPPNRPPNRNRPTRTLVLXdANTNVVEXEVEVCVEVEVEVCVZTZjBLAfCdWHWHVXVVPdRdJdLbLVNVCjBChBOZMZAVATSdSdWHWHUPWRSFSFKjBMjBYZLbNdFfQdQdFbHbMVMVAXAZZPPPNNPPNPFhBFjBTHVHTHVHTFVHVHTHTTTVTVTTETETETETbLbNAfAdYRWTMRMR'],
    ['AF', 'SO', '', 'oooooo', 'moB56BUgBUgBWiBSgBUgBSiB'],
    ['AF', 'SO', '', 'ooooooooooottttttt', '8rB10BSiBQiBQiBSiBOiBQiBjBWhBWjBYhBWhBYfWhBYfYfWfYfYXgB'],
    ['PM', 'CA', '', 'tcoooooooooooooooooo', '9/C+KDMHOJKJKJIJGJILEFCJCNAJDJFFFJCNDPFLDNFLF'],
    ['PM', 'CA', '', 'ooooccccccccccccccccc', 'llDyMJFJHHJJHTAJCJENGJEJILGPELGPEPCPCPALFLDNFRH'],
    ['NZ', 'PM', '', 'tttttttt', 'riDmJFALDLAJDJDJDLDHC'],
    ['NZ', 'PM', '', 'oocrssttttt', 'rkD+IFCJGHCFDFDHFFDJDHDFAHA'],
    ['NZ', 'PM', '', 'sstoooootttoo', 'nmD6IHDDDHADCDCDEFEHCFAFADADADC'],
    ['CO', 'PM', 'R', 'uuuuuuuuuuuuuuuu', 'znDmJJKJKFELELGHEHGLINEPIPGJENINMLKJM'],
    ['ND', 'NZ', 'L', 'uuuuuuuuuuuuuuuu', 'riDmJDFDHADCDEDCFEFCFCFEDCDCFAFCHCDCD'],
    ['PM', 'ND', '', 'tttcttcc', 'riDmJQGKGMIGGIEIEKKIM'],
    ['CA', 'ND', 'R', 'uuuuuuuuuuuuuuuuuuuuuuut', '9/C+KAKAQAOEOGKIIIIGOKMMIKGMGMEIIKIIOIMOKQCSCYCaCKDMH'],
    ['CA', 'ND', 'R', 'rtrrrrrrrr', 'r4C0QGHMJONKJKLOPKPOPMPGN'],
    ['ND', 'SA', '', 'ttttttcccccc', 'hmDjEMAMASIOGQKMIKGMMMYIaKUIQ'],
    ['ND', 'SA', '', 'ccttctcccccctccccttccctcccccccccccttcccttccttcccccctttttrt', 'xhDGMSOMSIOIMIKEKOMOKIMMMIKMKEGGGKAIIGKGIEKOGIEGMGGMCKCKIIAIAKHOAGAENKFGIEGEIIEEEGKEKEEEGGIEKEGGKKKIGIIIIEGEGEOGGCGCIDIA'],
    ['CA', 'SA', '', 'ttttttrttt', '/0CkNSEaCQAUAQDSAEDUFMCMC'],
  ];

  // [code, name, label, no-net-rotation Euler vector in radians per million
  // years: x towards 0° E on the equator, y towards 90° E, z north]
  const PLATES = [
    ['AF', 'African Plate', [12.4, 7.6], [0.000852, -0.003070, 0.003763]],
    ['AM', 'Amur Plate', null, [-0.000600, -0.003774, 0.003597]],
    ['AN', 'Antarctic Plate', [-80.1, 63.1], [-0.000859, -0.001672, 0.003548]],
    ['AP', 'Altiplano Plate', null, [0.000493, -0.008283, -0.001272]],
    ['AR', 'Arabian Plate', [20.9, 47.6], [0.007022, -0.000738, 0.007369]],
    ['AS', 'Aegean Sea Plate', null, [-0.001401, 0.001800, 0.000787]],
    ['AT', 'Anatolian Plate', null, [0.014147, 0.007336, 0.013681]],
    ['AU', 'Australian Plate', [-28.6, 138.6], [0.007800, 0.005153, 0.006125]],
    ['BH', 'Bird’s Head Plate', null, [-0.001365, 0.010026, -0.008979]],
    ['BR', 'Balmoral Reef Plate', null, [-0.002419, 0.002601, -0.007621]],
    ['BS', 'Banda Sea Plate', null, [-0.020673, 0.034956, 0.000099]],
    ['BU', 'Burma Plate', null, [0.009957, -0.039656, -0.002931]],
    ['CA', 'Caribbean Plate', [15.4, -65.9], [0.000139, -0.004179, 0.002687]],
    ['CL', 'Caroline Plate', null, [0.002168, 0.001078, -0.009180]],
    ['CO', 'Cocos Plate', [8.4, -96.4], [-0.010464, -0.021576, 0.010767]],
    ['CR', 'Conway Reef Plate', null, [-0.062724, 0.010085, -0.023883]],
    ['EA', 'Easter Plate', null, [0.068587, 0.165403, 0.084200]],
    ['EU', 'Eurasian Plate', [59.4, 63.1], [-0.001020, -0.002366, 0.002994]],
    ['FT', 'Futuna Plate', null, [-0.084800, 0.002406, -0.025051]],
    ['GP', 'Galápagos Plate', null, [0.014707, 0.094233, 0.004907]],
    ['IN', 'Indian Plate', [13.4, 76.1], [0.006632, 0.000069, 0.006632]],
    ['JF', 'Juan de Fuca Plate', [45.9, -127.9], [0.004964, 0.008045, -0.005055]],
    ['JZ', 'Juan Fernández Plate', null, [0.106464, 0.304330, 0.220400]],
    ['KE', 'Kermadec Plate', null, [0.031770, 0.003056, 0.026313]],
    ['MA', 'Mariana Plate', null, [-0.015383, 0.013115, 0.005304]],
    ['MN', 'Manus Plate', null, [-0.779392, 0.445741, -0.057565]],
    ['MO', 'Maoke Plate', null, [-0.000028, 0.012608, 0.003309]],
    ['MS', 'Molucca Sea Plate', null, [0.036674, -0.053422, 0.003551]],
    ['NA', 'North American Plate', [48.9, -81.9], [0.000219, -0.003569, -0.000311]],
    ['NB', 'North Bismarck Plate', null, [-0.005885, 0.008639, -0.010530]],
    ['ND', 'North Andes Plate', null, [-0.001438, -0.001492, 0.000321]],
    ['NH', 'New Hebrides Plate', null, [0.043364, -0.004677, 0.000473]],
    ['NI', 'Niuafo’ou Plate', null, [-0.056890, -0.006021, -0.003335]],
    ['NZ', 'Nazca Plate', [-19.6, -94.4], [-0.001571, -0.008548, 0.009451]],
    ['OK', 'Okhotsk Plate', null, [-0.000508, -0.003436, 0.002015]],
    ['ON', 'Okinawa Plate', null, [-0.027772, 0.025053, 0.027080]],
    ['PA', 'Pacific Plate', [6.4, -143.4], [-0.001549, 0.004869, -0.010128]],
    ['PM', 'Panama Plate', null, [-0.001589, -0.004421, 0.002687]],
    ['PS', 'Philippine Sea Plate', [18.4, 134.1], [0.010616, -0.007641, -0.010494]],
    ['RI', 'Rivera Plate', null, [-0.020732, -0.065735, 0.026669]],
    ['SA', 'South American Plate', [-20.6, -38.4], [-0.001077, -0.001485, -0.001028]],
    ['SB', 'South Bismarck Plate', null, [0.119894, -0.073966, 0.016994]],
    ['SC', 'Scotia Plate', [-57.1, -53.4], [-0.000432, -0.002564, -0.001594]],
    ['SL', 'Shetland Plate', null, [-0.002382, -0.001832, 0.003195]],
    ['SO', 'Somali Plate', [-6.1, 50.1], [-0.000262, -0.003885, 0.004475]],
    ['SS', 'Solomon Sea Plate', null, [-0.018745, 0.022055, -0.001505]],
    ['SU', 'Sunda Plate', [6.4, 108.6], [0.001652, -0.005571, 0.005726]],
    ['SW', 'South Sandwich Plate', null, [0.021831, -0.014500, -0.020593]],
    ['TI', 'Timor Plate', null, [-0.010949, 0.027932, -0.001297]],
    ['TO', 'Tonga Plate', null, [0.140569, 0.010485, 0.068085]],
    ['WL', 'Woodlark Plate', null, [-0.018380, 0.023347, 0.000038]],
    ['YA', 'Yangtze Plate', null, [-0.002385, -0.001299, 0.006146]],
  ];
  const NAMED = ['PA', 'NA', 'SA', 'EU', 'AF', 'AN', 'AU', 'IN', 'NZ', 'SO', 'AR', 'PS', 'SU', 'CO', 'CA', 'SC', 'JF'];

  // 1024 x 512 map of which plate is where: the value is the plate's place in PLATES, plus 1.
  const IDS_PNG = 'data:image/png;base64,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';

  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function vlq(s) {
    const out = [];
    let v = 0, shift = 0;
    for (let i = 0; i < s.length; i++) {
      const d = B64.indexOf(s[i]);
      v += (d & 31) << shift;
      if (d & 32) { shift += 5; continue; }
      out.push(v & 1 ? -(v >> 1) : v >> 1);
      v = 0; shift = 0;
    }
    return out;
  }

  const total = DATA.reduce((n, b) => n + b[3].length + 1, 0);
  const LATLON = new Float32Array(total * 2);
  const BOUNDARIES = [];
  let at = 0;
  for (const [left, right, top, kinds, pts] of DATA) {
    const q = vlq(pts), n = q.length / 2;
    let lon = 0, lat = 0;
    for (let i = 0; i < n; i++) {
      lon += q[2 * i]; lat += q[2 * i + 1];
      LATLON[2 * (at + i)] = lat / 20;
      LATLON[2 * (at + i) + 1] = lon / 20;
    }
    BOUNDARIES.push({ left, right, top, kinds, at, n });
    at += n;
  }

  const LIST = PLATES.map(([code, name, label, w], i) => ({ code, name, id: i + 1, label, w }));
  const byCode = {};
  for (const p of LIST) byCode[p.code] = p;

  // Velocity of a plate at a place: the plate's turning (w) times the radius.
  function drift(plate, lat, lon) {
    const p = typeof plate === 'string' ? byCode[plate] : plate, R = 6371, k = Math.PI / 180;
    const la = lat * k, lo = lon * k, cl = Math.cos(la);
    const r = [cl * Math.cos(lo), cl * Math.sin(lo), Math.sin(la)], w = p.w;
    const v = [w[1] * r[2] - w[2] * r[1], w[2] * r[0] - w[0] * r[2], w[0] * r[1] - w[1] * r[0]];
    const east = -Math.sin(lo) * v[0] + Math.cos(lo) * v[1];
    const north = -Math.sin(la) * Math.cos(lo) * v[0] - Math.sin(la) * Math.sin(lo) * v[1] + cl * v[2];
    return [east * R, north * R];
  }

  let loading = null;
  function load() {
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = 1024; cv.height = 512;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const px = ctx.getImageData(0, 0, 1024, 512).data, ids = new Uint8Array(1024 * 512);
        for (let i = 0; i < ids.length; i++) ids[i] = px[i * 4];
        resolve({
          at(lat, lon) {
            const x = Math.floor((((lon + 180) / 360 * 1024) % 1024 + 1024) % 1024);
            const y = Math.max(0, Math.min(511, Math.floor((90 - lat) / 180 * 512)));
            return LIST[ids[y * 1024 + x] - 1] || null;
          },
          texture: () => ({ data: ids, width: 1024, height: 512, format: 'luminance', nearest: true }),
        });
      };
      img.onerror = () => reject(new Error('The plate map could not be read.'));
      img.src = IDS_PNG;
    });
    return loading;
  }

  root.Plates = { BOUNDARIES, LATLON, LIST, NAMED, plate: (code) => byCode[code], drift, load };
})(typeof self !== 'undefined' ? self : this);
