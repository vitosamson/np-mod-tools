import { useEffect, useState } from 'preact/hooks';
import Approval from './Approval';
import RFE from './RFE';
import Rejection from './Rejection';
import Modmail from './Modmail';
import {
  getAccessToken,
  getModmailReplies,
  getRules,
  useToggleState,
  postAlreadyApproved,
  postAlreadyRFEd,
  postAlreadyRejected,
  getModmailMessageLink,
  SubredditRule,
  NormalizedModmailMessage,
} from '../utils';

interface Feedback {
  type: string;
  message: string;
}

export default function SubmissionModeration() {
  const [rules, setRules] = useState<SubredditRule[]>([]);
  const [showApproval, toggleShowApproval] = useToggleState(false);
  const [showRFE, toggleShowRFE] = useToggleState(false);
  const [showRejection, toggleShowRejection] = useToggleState(false);
  const [showModmail, toggleShowModmail] = useToggleState(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [modmailReplies, setModmailReplies] = useState<NormalizedModmailMessage[]>([]);
  const isApproved = postAlreadyApproved();
  const isRFEd = postAlreadyRFEd();
  const isRejected = postAlreadyRejected();
  const modmailMessageLink = getModmailMessageLink();

  const _getModmailReplies = async () => {
    try {
      setModmailReplies(await getModmailReplies());
    } catch (err) {
      console.error('could not get modmail replies', err);
      setFeedback([
        ...feedback,
        {
          type: 'error',
          message: 'Could not fetch modmail messages',
        },
      ]);
    }
  };

  useEffect(() => {
    (async () => {
      await getAccessToken();
      _getModmailReplies();

      try {
        setRules(await getRules());
      } catch (err) {
        console.error('could not get rules', err);
      }
    })();
  }, []);

  const handleRejection = (errors: string[]) => {
    if (errors.length) {
      setFeedback(
        errors.map(err => ({
          type: 'error',
          message: err,
        }))
      );
    } else {
      _getModmailReplies();
      toggleShowRejection();
      setFeedback([
        {
          type: 'success',
          message: 'Successfully rejected post',
        },
      ]);
    }
  };

  const handleApproval = async (errors: string[]) => {
    if (errors.length) {
      setFeedback(
        errors.map(err => ({
          type: 'error',
          message: err,
        }))
      );
    } else {
      _getModmailReplies();
      toggleShowApproval();
      setFeedback([
        {
          type: 'success',
          message: 'Successfully approved post',
        },
      ]);
    }
  };

  const handleSentModmail = () => {
    _getModmailReplies();
  };

  const handleRFE = (errors: string[]) => {
    if (errors.length) {
      setFeedback(
        errors.map(err => ({
          type: 'error',
          message: err,
        }))
      );
    } else {
      _getModmailReplies();
      toggleShowRFE();
      setFeedback([
        {
          type: 'success',
          message: 'Successfully marked post as RFE',
        },
      ]);
    }
  };

  return (
    <div style={{ marginTop: 5 }}>
      <span style={{ fontWeight: 'bold', marginLeft: 5 }}>NP Moderation:</span>

      {!isApproved && (
        <a href="#" className="pretty-button positive" onClick={toggleShowApproval}>
          Approve
        </a>
      )}
      {!isApproved && !isRFEd && (
        <a href="#" className="pretty-button neutral" onClick={toggleShowRFE}>
          RFE
        </a>
      )}
      {!isRejected && (
        <a href="#" className="pretty-button negative" onClick={toggleShowRejection}>
          Reject
        </a>
      )}

      {modmailMessageLink && (
        <a href="#" className="pretty-button" onClick={toggleShowModmail}>
          Modmail [{(modmailReplies && modmailReplies.length) || '0'}]
        </a>
      )}

      {!modmailMessageLink && <span style={{ marginLeft: 5, color: 'orange' }}>No trackback comment was found</span>}

      <Approval show={showApproval} onHide={toggleShowApproval} onApprove={handleApproval} />
      <RFE show={showRFE} onHide={toggleShowRFE} onRFE={handleRFE} />
      <Rejection show={showRejection} onHide={toggleShowRejection} onReject={handleRejection} rules={rules} />
      <Modmail show={showModmail} onHide={toggleShowModmail} onSend={handleSentModmail} replies={modmailReplies} />

      {feedback.map(f => (
        <div
          style={{
            color: f.type === 'success' ? 'green' : 'red',
          }}
        >
          {f.message}
        </div>
      ))}
    </div>
  );
}
