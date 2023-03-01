// Copyright (c) 2017 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useRef, useState, useLayoutEffect } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { XYPlot, XAxis, YAxis, MarkSeries, Hint } from 'react-vis';
import { compose, withState, withProps } from 'recompose';

import { FALLBACK_TRACE_NAME } from '../../../constants';
import { ONE_MILLISECOND, formatDuration } from '../../../utils/date';

import './react-vis.css';
import './ScatterPlot.css';

function ScatterPlotImpl(props) {
  const { data, onValueClick, overValue, onValueOver, onValueOut, calculateContainerWidth } = props;

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    function updateContainerWidth() {
      if (containerRef.current) {
        setContainerWidth(calculateContainerWidth(containerRef.current));
      }
    }

    // Calculate the initial width on first render.
    updateContainerWidth();

    window.addEventListener('resize', updateContainerWidth);

    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  return (
    <div className="TraceResultsScatterPlot" ref={containerRef}>
      {containerWidth && (
        <XYPlot
          margin={{
            left: 50,
          }}
          width={containerWidth}
          colorType="literal"
          height={200}
        >
          <XAxis
            title="Time"
            tickTotal={4}
            tickFormat={t => moment(t / ONE_MILLISECOND).format('hh:mm:ss a')}
          />
          <YAxis title="Duration" tickTotal={3} tickFormat={t => formatDuration(t)} />
          <MarkSeries
            sizeRange={[3, 10]}
            opacity={0.5}
            onValueClick={onValueClick}
            onValueMouseOver={onValueOver}
            onValueMouseOut={onValueOut}
            data={data}
          />
          {overValue && (
            <Hint value={overValue}>
              <h4 className="scatter-plot-hint">{overValue.name || FALLBACK_TRACE_NAME}</h4>
            </Hint>
          )}
        </XYPlot>
      )}
    </div>
  );
}

const valueShape = PropTypes.shape({
  x: PropTypes.number,
  y: PropTypes.number,
  traceID: PropTypes.string,
  size: PropTypes.number,
  name: PropTypes.string,
});

ScatterPlotImpl.propTypes = {
  data: PropTypes.arrayOf(valueShape).isRequired,
  overValue: valueShape,
  onValueClick: PropTypes.func.isRequired,
  onValueOut: PropTypes.func.isRequired,
  onValueOver: PropTypes.func.isRequired,
  calculateContainerWidth: PropTypes.func,
};

ScatterPlotImpl.defaultProps = {
  overValue: null,
  // JSDOM does not, as of 2023, have a layout engine, so allow tests to supply a mock width as a workaround.
  calculateContainerWidth: container => container.clientWidth,
};

const ScatterPlot = compose(
  withState('overValue', 'setOverValue', null),
  withProps(({ setOverValue }) => ({
    onValueOver: value => setOverValue(value),
    onValueOut: () => setOverValue(null),
  }))
)(ScatterPlotImpl);

export { ScatterPlotImpl };

export default ScatterPlot;