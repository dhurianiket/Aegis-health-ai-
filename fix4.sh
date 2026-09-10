cat << 'INNER_EOF' > /tmp/missing2
                const plainExplanation = getPlainEnglishSummary(markerName);

                // Find matching history from pre-computed map
                const target = markerName.toLowerCase().trim();
                let history: { date: string; value: number; timestamp?: number }[] = [];
                for (const [key, values] of historicalDataByMarker.entries()) {
                  if (key === target || key.includes(target) || target.includes(key)) {
                    history = history.concat(values);
                  }
                }
                history.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
                history = history.map((h: any) => ({ date: h.date, value: h.value }));

                const refLow = m.referenceLow !== undefined && m.referenceLow !== null ? Number(m.referenceLow) : null;
                const refHigh = m.referenceHigh !== undefined && m.referenceHigh !== null ? Number(m.referenceHigh) : null;

                return (
                  <div
                    key={idx}
                    className="bg-slate-950/85 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-lg transition-all duration-200 flex flex-col justify-between"
                  >
INNER_EOF
sed -i '401,401d' src/components/LabReports/VisualLabReportCard.tsx
