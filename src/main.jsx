import React from 'react';
import { createRoot } from 'react-dom/client';
import QuestionView from './QuestionView';
import ErrorBoundary from './components/ErrorBoundary';

let root = null;

window.mountQuestionView = function (container, question, callbacks) {
  try {
    if (root) {
      root.unmount();
      root = null;
    }
    container.innerHTML = '';
    root = createRoot(container);
    root.render(
      <ErrorBoundary>
        <QuestionView question={question} {...callbacks} />
      </ErrorBoundary>
    );
  } catch (err) {
    console.error('mountQuestionView error:', err);
    container.innerHTML = '<p style="color:red;padding:20px;">Error loading question. Check console.</p>';
  }
};

window.unmountQuestionView = function () {
  if (root) {
    root.unmount();
    root = null;
  }
};
