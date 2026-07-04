type Props = {
  quote: string;
  cite?: string;
};

export function QuoteBlock({ quote, cite }: Props) {
  return (
    <blockquote className="quote-block">
      <p>{quote}</p>
      {cite ? <cite>{cite}</cite> : null}
    </blockquote>
  );
}
