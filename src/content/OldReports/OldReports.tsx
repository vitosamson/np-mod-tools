import { useState } from 'preact/hooks';
import { ModReport, UserReport } from '../types';

interface Props {
  userReports: UserReport[];
  modReports: ModReport[];
}

export default function OldReports({ userReports, modReports }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      old reports: {userReports.length + modReports.length}
      <span style={{ marginLeft: 10, cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'collapse' : 'expand'}
      </span>
      {isExpanded && (
        <>
          <hr style={{ borderBottomStyle: 'none' }} />

          {userReports.length > 0 && (
            <div style={{ marginTop: 5 }}>
              <span style={{ marginBottom: 2, fontWeight: 'bold' }}>user reports</span>
              {userReports.map(([report, count]) => (
                <p>
                  ({count}) {report}
                </p>
              ))}
            </div>
          )}

          {modReports.length > 0 && (
            <div style={{ marginTop: 5 }}>
              <span style={{ marginBottom: 2, fontWeight: 'bold' }}>mod reports</span>
              {modReports.map(([report, mod]) => (
                <p>
                  {mod}: {report}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
