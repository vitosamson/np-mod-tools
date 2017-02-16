import React, { Component, PropTypes } from 'react';

import npModUtils from '../utils';

export default class Rejection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedReasons: {},
    };
    this.confirmRejection = this.confirmRejection.bind(this);
  }

  toggleSelectedReason(rule) {
    this.setState({
      selectedReasons: Object.assign({}, this.state.selectedReasons, {
        [rule]: !this.state.selectedReasons[rule],
      }),
    });
  }

  confirmRejection(e) {
    e.preventDefault();
    const { selectedReasons } = this.state;
    const { onReject } = this.props;
    const hasSelectedReasons = Object.keys(selectedReasons).some(key => !!selectedReasons[key]);

    if (hasSelectedReasons) {
      const reasons = Object.keys(selectedReasons).filter(key => !!selectedReasons[key]);
      const ruleLetters = reasons.map(reason => reason.match(/\w:/)[0].substr(0, 1)).sort();
      const flair = `Rejected: ${ruleLetters.join(', ')}`;
      const errors = [];

      Promise.all([
        npModUtils.flairPost(flair).catch(err => {
          errors.push('Could not flair post');
        }),
        npModUtils.updateModmail(flair).catch(err => {
          errors.push('Could not update modmail');
        }),
      ]).then(() => {
        onReject(errors.length ? errors : null);
      });
    }
  }

  render() {
    const { selectedReasons } = this.state;
    const { show, rules, onHide } = this.props;

    if (!show) return null;

    return (
      <div style={{ padding: '10px 20px', fontSize: '1.2em', border: '1px solid #ccc' }}>
        { rules.map((rule, idx) =>
          <div key={idx} style={{ marginBottom: 5 }}>
            <input
              type="checkbox"
              checked={selectedReasons[rule.short_name] === true}
              onChange={() => this.toggleSelectedReason(rule.short_name)}
              name={rule.short_name}
              id={rule.short_name}
              style={{ marginRight: 5 }}
            />
            <label htmlFor={rule.short_name}>{ rule.short_name }</label>
          </div>
        )}

        { !rules.length &&
          <div className="error">
            This subreddit has no rules!
          </div>
        }

        <div style={{ marginTop: 15 }}>
          <a href="#" className="pretty-button neutral" onClick={onHide}>Cancel</a>
          <a href="#" className="pretty-button negative" onClick={this.confirmRejection}>
            Confirm rejection
          </a>
        </div>

        <div style={{ marginTop: 5, color: '#98abba' }}>
          After confirming rejection, the modmail thread will be updated and the post will be flaired.
        </div>
      </div>
    );
  }
}

Rejection.propTypes = {
  show: PropTypes.bool,
  rules: PropTypes.arrayOf(PropTypes.object).isRequired,
  onHide: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};
