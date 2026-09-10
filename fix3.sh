cat << 'INNER_EOF' > /tmp/missing
    });

    // Sort all arrays
    historyMap.forEach((historyArr) => {
      historyArr.sort((a, b) => a.timestamp - b.timestamp);
    });

    return historyMap;
  }, [historicalReports, report.id]);
INNER_EOF
sed -i '371r /tmp/missing' src/components/LabReports/VisualLabReportCard.tsx
sed -i '442,442d' src/components/LabReports/VisualLabReportCard.tsx
