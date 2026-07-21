import { Field } from "./MercattoUI";

export default function BirthDateField({ value, onChange, error }) {
  return (
    <Field
      label="Fecha de nacimiento"
      value={value}
      onChangeText={onChange}
      placeholder="AAAA-MM-DD"
      keyboardType="numbers-and-punctuation"
      error={error}
    />
  );
}
