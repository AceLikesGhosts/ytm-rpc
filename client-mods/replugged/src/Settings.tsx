import { components, util } from 'replugged';
import { pluginSettings } from '.';
const { TextInput, Category, SwitchItem } = components;

function NumberInput(props: { value: number; onChange: (value: number) => void; }): JSX.Element {
    function isValid(str: any): str is number {
        return typeof Number(str) === 'number';
    }

    return (
        <TextInput
            value={props.value}
            onChange={(value) => {
                if(!isValid(value) && value !== '0') {
                    return;
                }

                props.onChange(Number(value));
            }}
        >

        </TextInput>
    );
}

export default function (): React.ReactElement {
    const { value: PortValue, onChange: PortOnChange } = util.useSetting(pluginSettings, 'port', 2134);
    const { value: IntervalValue, onChange: IntervalChange } = util.useSetting(pluginSettings, 'intervalDurationSeconds', 15);
    const { value: ShowTimeBar, onChange: TimeBarChange } = util.useSetting(pluginSettings, 'showTimeBar', false);

    return (
        <div>
            <Category title='Settings'>
                <NumberInput value={PortValue} onChange={PortOnChange} />
                <NumberInput value={IntervalValue} onChange={IntervalChange} />
                <SwitchItem
                    note='Display time bar (LOCALLY)'
                    value={ShowTimeBar}
                    onChange={TimeBarChange}
                />
            </Category>
        </div>
    );
}