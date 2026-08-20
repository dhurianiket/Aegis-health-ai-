export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;

  const separator = ",";
  const keys = Object.keys(data[0]);

  const csvContent = [
    keys.join(separator),
    ...data.map((row) =>
      keys
        .map((key) => {
          let cell =
            row[key] === null || row[key] === undefined ? "" : row[key];
          cell =
            cell instanceof Date
              ? cell.toISOString()
              : String(cell).replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        })
        .join(separator),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

import { exportToFhirBundle, downloadFhirJson } from './fhirService';

export const exportToFHIR = (profile: any, labReports?: any[], notes?: string | any) => {
  const patient = {
    id: profile?.id,
    name: profile?.name || profile?.fullName,
    gender: profile?.gender,
    birthDate: profile?.dob || profile?.birthDate,
    email: profile?.email,
    phone: profile?.phone || profile?.mobile,
    address: profile?.address,
  };
  const bundle = exportToFhirBundle(patient, labReports || profile?.labValues ? [{ id: 'labs', biomarkers: profile.labValues }] : [], notes || profile?.doctorNotes?.join('\n\n'));
  downloadFhirJson(bundle, `FHIR_Record_${profile?.name || profile?.fullName || 'Patient'}.json`);
};

