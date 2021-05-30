import { useEffect, useState } from 'preact/hooks';
import Approval from './Approval';
import RFE from './RFE';
import Rejection from './Rejection';
import Slack from './Slack';
import {
  getAccessToken,
  getRules,
  useToggleState,
  postAlreadyApproved,
  postAlreadyRFEd,
  postAlreadyRejected,
  SubredditRule,
} from '../utils';
import { SlackMessage } from '../types';
import { getSlackThread, getSlackThreadReplies } from '../slack';

interface Feedback {
  type: string;
  message: string;
}

export default function SubmissionModeration() {
  const [rules, setRules] = useState<SubredditRule[]>([]);
  const [showApproval, toggleShowApproval] = useToggleState(false);
  const [showRFE, toggleShowRFE] = useToggleState(false);
  const [showRejection, toggleShowRejection] = useToggleState(false);
  const [showSlack, toggleShowSlack] = useToggleState(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [slackReplies, setSlackReplies] = useState<SlackMessage[]>([]);
  const isApproved = postAlreadyApproved();
  const isRFEd = postAlreadyRFEd();
  const isRejected = postAlreadyRejected();
  const { link: slackLink } = getSlackThread();

  const _getSlackReplies = async () => {
    try {
      setSlackReplies(await getSlackThreadReplies());
    } catch (err) {
      console.error('Could not get slack replies', err);
      setFeedback([
        ...feedback,
        {
          type: 'error',
          message: 'Could not get slack replies',
        },
      ]);
    }
  };

  useEffect(() => {
    (async () => {
      await getAccessToken();
      _getSlackReplies();

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
      _getSlackReplies();
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
      _getSlackReplies();
      toggleShowApproval();
      setFeedback([
        {
          type: 'success',
          message: 'Successfully approved post',
        },
      ]);
    }
  };

  const handleSentSlackMessage = () => {
    _getSlackReplies();
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
      _getSlackReplies();
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

      {slackLink ? (
        <a href="#" className="pretty-button" onClick={toggleShowSlack}>
          Slack [{slackReplies.length || '0'}]
        </a>
      ) : (
        <span style={{ marginLeft: 5, color: 'orange' }}>No slack link was found</span>
      )}

      <Approval show={showApproval} onHide={toggleShowApproval} onApprove={handleApproval} />
      <RFE show={showRFE} onHide={toggleShowRFE} onRFE={handleRFE} />
      <Rejection show={showRejection} onHide={toggleShowRejection} onReject={handleRejection} rules={rules} />
      <Slack show={showSlack} onHide={toggleShowSlack} onSend={handleSentSlackMessage} replies={slackReplies} />

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
